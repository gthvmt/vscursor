export class NoAuthRateLimitError extends Error {
    constructor(
        message = 'You have reached the rate limit for unauthenticated requests. Please authenticate to continue.'
    ) {
        super(message);
        this.name = 'NoAuthRateLimitError';
    }
}

export class AuthRateLimitError extends Error {
    constructor(
        message = 'You have reached the rate limit for authenticated requests. Please wait before making more requests.'
    ) {
        super(message);
        this.name = 'AuthRateLimitError';
    }
}

export class RateLimitError extends Error {
    constructor(
        message = 'We are bing ratelimited. Try again in a bit.'
    ) {
        super(message);
        this.name = 'RateLimitError';
    }
}