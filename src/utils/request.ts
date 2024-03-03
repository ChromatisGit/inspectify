export interface NewRequest {
    endpoint: string;
    headers: any;
    callback: (response: SyncResponse, parameters?: any) => void;
    parameters?: any
}

export interface SyncResponse {
    status: number;
    content: any;
    request?: NewRequest
}

class RequestManager {
    private requestQueue: NewRequest[];

    private rateLimited: boolean;

    constructor() {
        this.requestQueue = [];
        this.checkQueue();
        this.rateLimited = false
    }

    private async checkQueue() {
        while (true) {
            if(this.rateLimited) {
                await new Promise(resolve => setTimeout(resolve, 5000));
                this.rateLimited = false
            }

            if (this.requestQueue.length > 0) {
                const request = this.requestQueue.shift()!;
                await this.sendRequest(request);
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    private async sendRequest(request: NewRequest) {
        const { endpoint, headers, callback, parameters } = request;
        let syncResponse: SyncResponse;
        try {
            const response = await fetch(endpoint, { headers });
            const content = await response.json() ?? {};
            syncResponse = { status: response.status, content};
            if(!response.ok) {
                syncResponse.request = request
            }
        } catch (error: any) {
            console.error('Error:', error);
            let statusCode;
            if (error instanceof TypeError || error instanceof SyntaxError) {
                statusCode = 400;
            } else {
                statusCode = 500;
            }
            syncResponse = { status: statusCode, content: {}};
        }
        finally {
            callback(syncResponse!, parameters);
        }
    }

    public addRequest(request: NewRequest) {
        this.requestQueue.push(request);
    }

    public retryRequest(request: NewRequest) {
        this.requestQueue.unshift(request)
    }

    public gotRateLimited() {
        this.rateLimited = true;
    }

    public clearRequestQueue() {
        this.requestQueue = [];
    }
}

export const requestManager = new RequestManager();