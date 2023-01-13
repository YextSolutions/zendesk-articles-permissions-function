declare const zendeskSubdomain: string;
declare const zendeskLocale: string;
declare const zendeskUsername: string;
declare const zendeskPassword: string;

//converting basic auth to bit64 to pass in header
const basicAuthEnconded = btoa(`${zendeskUsername}:${zendeskPassword}`);
const myHeaders = new Headers();
myHeaders.append("Authorization", `Basic ${basicAuthEnconded}`);
const requestOptions = {
  method: 'GET',
  headers: myHeaders,
};

export const fetchHelpCenterContent = async (inputString: string) => {
    const inputJson = JSON.parse(inputString);
    const pageToken = inputJson.pageToken;

    let articlesListEndpoint = `https://${zendeskSubdomain}.zendesk.com/api/v2/help_center/${zendeskLocale}/articles`;
    if(pageToken){
        articlesListEndpoint = pageToken;
    }

    const articlesResponse = await fetch(articlesListEndpoint, requestOptions).then(response => parseApiResponse(response));
    // if (articlesResponse === 429) {
    //     return JSON.stringify({ data: [], nextPageToken: pageToken })
    // }
    const articleArray = articlesResponse.articles;
    const articles: any[] = [];
    for (const article of articleArray) {
        if (article.user_segment_id) {
            const segmentResponse = await fetchPermissions(article.user_segment_id);
            // if (segmentResponse === 429) {
            //     return JSON.stringify({ data: [], nextPageToken: pageToken })
            // }
            const finalArticle = { ...article, userSegment: segmentResponse };
            articles.push(finalArticle);
        } else {
            articles.push(article);
        }
    }
    const response: any = { data: { articles } };

    if(articlesResponse.next_page !== null){
        response['nextPageToken'] = articlesResponse.next_page;
    } 

    return JSON.stringify(response)
}

const fetchPermissions = async (segmentId: number) => await fetch(`https://${zendeskSubdomain}.zendesk.com/api/v2/help_center/user_segments/${segmentId}`, requestOptions).then(response => parseApiResponse(response));

// optional rate limit protection to comment in, along with commented code snippets above, if API quota issues arise:

// const parseApiResponse = (response: Response) => {
//     if (response.status === 200) {
//         return response.json();
//     } else if (response.status === 429) {
//         return response.status;
//     }
// }

const parseApiResponse = (response: Response) => {
    return response.json();
}