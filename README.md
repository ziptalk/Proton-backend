# Bot Performance API

## Installation

Clone the repository:

```bash
git clone https://github.com/ziptalk/neutronapi-backend.git
cd neutronapi-backend
```

Install dependencies:

```bash
npm install
```

## Configuration

Copy the example environment file and update the environment variables as needed:

```bash
cp .env.example .env
```

## Running the Application

To start the application, run:

```bash
npm start
```

The application will be accessible at `http://localhost:3000`.

## API Endpoints

### Bot Performance API Endpoints

#### Get Bot Performance Summary
- **Endpoint**: `/api/botPerformanceSummary`
- **Method**: GET
- **Description**: Show performance summary of the bot.
- **Response**:
  ```json
  {
    "pnlRate": 0.15,
    "pnlWinRate": 0.85,
    "subscribedCount": 1200,
    "apy": 0.10,
    "tvl": 500000.00,
    "mdd": 0.20
  }
  ```

#### Get Bot Performance Chart
- **Endpoint**: `/api/botPerformanceChart`
- **Method**: GET
- **Description**: Show performance chart of the bot.
- **Query Parameters**:
    - `timeframe` (number): The timeframe for the performance chart, default value is 365.
- **Response**:
  ```json
  {
    "timeframe": 365,
    "dailyPnlRate": 0.02,
    "data": [
      {
        "createdAt": "2024-06-26T00:00:00.000Z",
        "pnlRate": 0.05
      },
      {
        "createdAt": "2024-06-27T00:00:00.000Z",
        "pnlRate": 0.03
      },
      {
        "createdAt": "2024-06-28T00:00:00.000Z",
        "pnlRate": 0.04
      }
    ]
  }
  ```