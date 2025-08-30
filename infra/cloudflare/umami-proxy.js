const scriptName = '/script.js';
const endpoint = '/api/push';
const umamiUrl = 'https://example.com';
const umamiEndpoint = '/api/push';

const corsHeaders = {
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
};

const scriptWithoutExtension = scriptName.replace('.js', '');

addEventListener('fetch', (event) => {
    event.passThroughOnException();
    event.respondWith(handler(event));
});

async function handler(event) {
    const request = event.request;
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: corsHeaders
        });
    }

    const pathname = new URL(request.url).pathname;
    const [baseUri, ...extensions] = pathname.split('.');

    if (baseUri.endsWith(scriptWithoutExtension)) {
        return getScript(event, extensions);
    } else if (pathname.endsWith(endpoint)) {
        return postData(event);
    }
    return new Response(null, {
        status: 404,
        headers: corsHeaders
    });
}

async function getScript(event, extensions) {
    let response = await caches.default.match(event.request);
    if (!response) {
        response = await fetch(umamiUrl + '/script.js');
        var js = await response.text();

        js = js.replace('/api/collect', endpoint);
        response = new Response(js, {
            headers: {
                'Content-Type': 'application/javascript',
                ...corsHeaders
            },
        });

        event.waitUntil(caches.default.put(event.request, response.clone()));
    }

    return response;
}

async function postData(event) {
    const request = new Request(event.request);
    request.headers.delete('cookie');
    // fix umami 只识别成一个用户
    return await fetch(umamiUrl + umamiEndpoint, request);

    // const response = await fetch(umamiUrl + umamiEndpoint, {
    //     method: request.method,
    //     headers: {
    //         'Content-Type': 'application/json',
    //         ...request.headers,
    //         ...corsHeaders
    //     },
    //     body: request.body
    // });
    
    // const js = await response.text();
    // return new Response(js, {
    //     headers: {
    //         'Content-Type': 'application/json',
    //         ...corsHeaders
    //     }
    // });
}