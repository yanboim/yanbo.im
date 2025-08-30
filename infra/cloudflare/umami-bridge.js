// ref: https://blog.zhheo.com/p/61e9.html
// converted by cursor

// 配置参数
const CONFIG = {
  // umami url
  API_BASE_URL: 'https://example.com',
  USERNAME: 'admin',
  PASSWORD: 'password',
  WEBSITE_ID: '64859202-4411-4cb3-bad0-4e1fd9923d24',
  CACHE_TIME: 600 // 缓存时间10分钟（单位：秒）
}

const corsHeaders = {
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',

  'Access-Control-Max-Age': '600',
  'Content-Type': 'application/json',
  'Cache-Control': 'private, max-age=600',
};

// 设置CORS头
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json'
}

const CACHE_DATA = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 min

// 获取Token的辅助函数
async function getToken() {
  const url = `${CONFIG.API_BASE_URL}/api/auth/login`

  let tokenResponse = CACHE_DATA.get('token')

  if (tokenResponse) {
    return tokenResponse
  }

  // 如果缓存中没有Token，则请求获取
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: CONFIG.USERNAME,
      password: CONFIG.PASSWORD
    })
  })

  if (!response.ok) {
    throw new Error(`Failed to login! status: ${response.status}`)
  }

  const data = await response.json()
  const token = data.token
  CACHE_DATA.set('token', data.token)

  return token
}

// 处理请求的主函数
async function handleRequest(request) {
  //console.log(CACHE_DATA)
  if (request.method === "OPTIONS") {
    return new Response("OK", {
      headers: corsHeaders
    });      
  }

  // 检查缓存是否存在且未过期
  let cachedData = CACHE_DATA.get('data');
  let cachedTimestamp = CACHE_DATA.get('ts');
  const now = Date.now();

  if (cachedData && cachedTimestamp && (now - cachedTimestamp < CACHE_DURATION)) {
    console.log('data cache')

    // 返回缓存的数据
    return new Response(JSON.stringify(cachedData), {
      headers: {
        ...corsHeaders,
      }
    });
  }

  // 获取Token
  const token = await getToken()
  if (!token) {
    return new Response(JSON.stringify({ error: 'Failed to obtain token' }), {
      status: 500,
      ...corsHeaders
    })
  }

  // 获取当前时间戳（毫秒）
  const currentTimestamp = now
  
  // 计算各个时间段的起始时间戳
  const startTimestampToday = new Date().setHours(0,0,0,0)
  const startTimestampYesterday = startTimestampToday - 86400000
  const startTimestampLastMonth = currentTimestamp - 30 * 86400000
  const startTimestampLastYear = currentTimestamp - 365 * 86400000

  // 如果没有缓存，则获取新数据
  try {
    const [todayData, yesterdayData, lastMonthData, lastYearData] = await Promise.all([
      fetchUmamiData(startTimestampToday, currentTimestamp, token),
      fetchUmamiData(startTimestampYesterday, startTimestampToday, token),
      fetchUmamiData(startTimestampLastMonth, currentTimestamp, token),
      fetchUmamiData(startTimestampLastYear, currentTimestamp, token)
    ])

    const responseData = {
      today_uv: todayData?.visitors?.value,
      today_pv: todayData?.pageviews?.value,
      yesterday_uv: yesterdayData?.visitors?.value,
      yesterday_pv: yesterdayData?.pageviews?.value,
      last_month_pv: lastMonthData?.pageviews?.value,
      last_year_pv: lastYearData?.pageviews?.value
    }

    // 更新缓存
    CACHE_DATA.set('ts', currentTimestamp);
    CACHE_DATA.set('data', responseData);
    //console.log('data got')
    //console.log(CACHE_DATA)

    // 创建响应并缓存
    response = new Response(JSON.stringify(responseData),  {
      headers: {
        ...corsHeaders
      }
    })
    
    return response
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch data' }), {
      status: 500,
      ...corsHeaders
    })
  }
}

// 获取Umami数据的辅助函数
async function fetchUmamiData(startAt, endAt, token) {
  const url = `${CONFIG.API_BASE_URL}/api/websites/${CONFIG.WEBSITE_ID}/stats?startAt=${startAt}&endAt=${endAt}`
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return await response.json()
}


// 注册Worker
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})