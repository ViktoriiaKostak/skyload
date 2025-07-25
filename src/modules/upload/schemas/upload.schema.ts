export const CreateUploadSchema = {
  type: 'object',
  properties: {
    urls: {
      type: 'array',
      items: {
        type: 'string',
        format: 'uri',
      },
      minItems: 1,
      maxItems: 10,
    },
  },
  required: ['urls'],
};

export const UploadResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    originalUrl: { type: 'string' },
    filename: { type: 'string' },
    status: {
      type: 'string',
      enum: ['queued', 'downloading', 'uploading', 'completed', 'failed'],
    },
    googleDriveId: { type: 'string' },
    googleDriveLink: { type: 'string' },
    fileSize: { type: 'number' },
    errorMessage: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

export const UploadListResponseSchema = {
  type: 'object',
  properties: {
    uploads: {
      type: 'array',
      items: UploadResponseSchema,
    },
    total: { type: 'number' },
    page: { type: 'number' },
    limit: { type: 'number' },
  },
};
