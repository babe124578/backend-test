# Section 1: API

## Description

- This project built by [**`ExpressJS`**](https://expressjs.com/) and [**`MariaDB`**](https://mariadb.org/)
- The service above wrapped by [**`Docker`**](https://www.docker.com/) and using `docker-compose` to build.

#

- NOTE: The databases name is programming which have 2 tables are accounts and exchanges
- NOTE: Table accounts have 3 fields are name, crypto_name and balances
- NOTE: Table exchanges have 3 fields are from, to and rate

#

## Endpoint

- For local use
  - Run on http://localhost port 80 or http://127.0.0.1
  - e.g. http://localhost/admin/balances?currency=XRP
- For on server
  - Run on http://13.229.236.171
  - e.g. http://13.229.236.171/admin/exchanges?from=BTC&to=ETH
  
- You can click on GET route to see example.
- For other method please use `curl` or ` postman`

#### 1. [GET `/`](http://13.229.236.171/)

- Health check

#### 2. [GET `/admin/balances/`](http://13.229.236.171/admin/balances/)

- Get all currency balances
- If query parameter provided as example [`?currency=BTC`](http://13.229.236.171/admin/balances?currency=BTC), this will get balance of that currency

#### 3. [GET `/admin/exchanges/`](http://13.229.236.171/admin/exchanges?from=BTC&to=ETH)

- Get exchange_rate from query parameter as example `?from=BTC&to=ETH`
- If no query parameter or not found return error

#### 4. [GET `/customer/balances/`](http://13.229.236.171/customer/balances?name=A&crypto_name=BTC)

- Get balance from one customer as example query `?name=A&crypto_name=BTC`

#### 5. POST `/admin/currency/`

- This will add new type of currency which customer didn't have.
- The format of body as this example
  ```json
  {
    "amounts": 1000,
    "name": "C",
    "crypto_name": "XRP"
  }
  ```

#### 6. PUT `/admin/balances/update/`

- This will update balance of one customer with crypto_name provided.
- This could both increment and decrement
- Customer must have type of crypto_name in database.
- The format of body as this example
  ```json
  {
    "amounts": -100,
    "name": "C",
    "crypto_name": "XRP"
  }
  ```

#### 7. PUT `/admin/exchanges/currency/`

- This will update exchange rate from one currency to another one currency.
- If found in database use update, else use insert row instead.
- The format of body as this example
  ```json
  {
    "from": "ETH",
    "to": "BTC",
    "rate": 0.05
  }
  ```

#### 8. PUT `/customers/send/currency/`

- This will update balance of two customer be increase balance of sender and decrease balance of receiver.
- If sender balances less than amount that want to transfer the system will return error.
- If both currency not the same the system will query exchange_rate and calculate amount before transfer balances.
- The format of body as this example
  ```json
  {
    "sender": "A",
    "receiver": "C",
    "sender_currency": "XRP",
    "receiver_currency": "ETH",
    "amounts": 500
  }
  ```

---

## To run this project

1.  install `DOCKER`
2.  Go to /programming
3.  Run `docker-compose up -d --build`
<!-- 4.  After container started: restore database using
    - docker exec programming_databases_1 bash initialize_database.bash -->
4.  Access the API using browser `(localhost or 127.0.0.1)` method _GET_ only
5.  Access the API with other method [GET, POST, PUT, DELETE] use `curl` or postman application.

---

## To test this project

1.  Start project with previous sub-section
2.  After container started: restore database using
    - `docker exec programming_databases_1 bash initialize_database.bash`
    - This to reset database to initial data.
3.  Run `npm install`
4.  Run `npm test`
    - This will be tested by `newman`
5.  Or use **runner** in [Postman](https://www.postman.com/) to test the API

---

---

# Section 2: Database

- Based on node.js and Sequelize
- Can view model at [/database/index.js](https://github.com/babe124578/backend-test/blob/master/database/index.js) (can't run)
