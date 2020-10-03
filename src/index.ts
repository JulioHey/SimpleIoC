import {Container, inject, injectable} from 'inversify';
import * as http from 'http';
import "reflect-metadata";
import {Response} from 'express';
import { TypeAssertion } from 'typescript';

interface IQuote {
    sumInsured: number;
}

interface IControllerResponse {
    statusCode: number;
    response: string;
}

interface IController {
    findAll: () => IControllerResponse;
}

interface IDatabase {
    findAllQuotes: () => IQuote[];
}

const TYPES = {
    IController: Symbol("IController"),
    IDatabase: Symbol("IDatabase"),
}

@injectable()
class QuoteController implements IController {
    private database: IDatabase;

    constructor (@inject(TYPES.IDatabase) db: IDatabase) {
        this.database = db;
    }

    findAll(): IControllerResponse {
        const quotes: IQuote[] = this.database.findAllQuotes();
        return {
            statusCode: quotes.length > 0 ? 200 : 404,
            response: JSON.stringify(quotes)
        }
    }
}

@injectable()
class  StubDatabaseThatDoesNothing implements IDatabase {
    findAllQuotes (): IQuote[] {
        return [
            {sumInsured: 5000},
            {sumInsured: 2000}
        ]
    }
}

const container = new Container();

container.bind<IController>(TYPES.IController).to(QuoteController);
container.bind<IDatabase>(TYPES.IDatabase).to(StubDatabaseThatDoesNothing);

const controller: IController = container.get<IController>(TYPES.IController);

const app: http.Server = http.createServer((request: http.IncomingMessage, response: http.ServerResponse) => {
    if (request.url === "/quotes") {
        const result: IControllerResponse = controller.findAll();
        response.statusCode = result.statusCode;
        response.end(result.response)
    }
})

app.listen(3000, () => console.log("listening on 3000"));