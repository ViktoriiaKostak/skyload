# SkyLoad

A modern file upload service that downloads files from URLs and uploads them to Google Drive.

## Features

- **URL-based file downloads** - Upload files by providing URLs
- **Google Drive integration** - Automatic upload to Google Drive with shareable links
- **Queue-based processing** - Asynchronous file processing using Redis and BullMQ
- **RESTful API** - Clean REST API with Swagger documentation
- **Docker support** - Easy deployment with Docker Compose
- **Database persistence** - PostgreSQL for storing upload metadata
- **Error handling** - Comprehensive error handling and logging

## Tech Stack

- **Backend**: NestJS (Node.js)
- **Database**: PostgreSQL with TypeORM
- **Queue**: Redis + BullMQ
- **File Storage**: Google Drive API
- **Containerization**: Docker + Docker Compose
- **Documentation**: Swagger/OpenAPI

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Google Cloud Platform account with Drive API enabled
- Google Service Account credentials

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/ViktoriiaKostak/skyload.git
   cd skyload
   ```

2. **Configure Google Drive**
   - Create a Google Cloud Project
   - Enable Google Drive API
   - Create a Service Account
   - Download credentials as `google-credentials.json`
   - Create a Shared Drive in Google Drive
   - Add Service Account as Manager to Shared Drive

3. **Set environment variables**
   ```bash
   export GOOGLE_DRIVE_FOLDER_ID=your_shared_drive_id
   ```

4. **Start the application**
   ```bash
   docker-compose up -d
   ```

5. **Access the API**
   - API: http://localhost:80
   - Swagger docs: http://localhost:80/api

## API Usage

### Upload files from URLs

```bash
curl -X POST http://localhost:80/uploads \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://example.com/file1.jpg",
      "https://example.com/file2.pdf"
    ]
  }'
```

### Check upload status

```bash
curl -X GET http://localhost:80/uploads/{upload_id}/status
```

### List all uploads

```bash
curl -X GET http://localhost:80/uploads?page=1&limit=10
```

## Project Structure

```
src/
├── modules/
│   ├── drive/          # Google Drive integration
│   ├── upload/         # Upload processing
│   └── shared/         # Shared utilities
├── test/               # E2E tests
└── main.ts            # Application entry point
```

## Development

### Running tests
```bash
npm test              # Unit tests
npm run test:e2e      # E2E tests
```

### Building
```bash
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License 