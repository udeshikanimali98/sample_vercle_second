import {Request, Response} from 'express';

export function logRequest(req: Request, res: Response, next: any) {
    if (req.method !== "OPTIONS") {
       // UaLogger.info(req.headers['user-agent'] + " :: " + req.url);
        res.on('finish', () => {
            const user = (req.user && req.user._id) ? 'U=' + req.user._id.toString() : "";
            const resOut = `${user.padEnd(6)} ${res.statusCode} ${req.method.padEnd(7)} ${req.url} ${res.statusMessage}`;
            //RequestLogger.info(resOut);
        });
    }
    next();
}