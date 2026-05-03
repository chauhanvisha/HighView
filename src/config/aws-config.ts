// AWS Configuration for HighView Video Analysis
export const awsConfig = {
  region: 'us-east-1', // Change to your AWS region
  s3: {
    bucket: 'highview-classroom-videos', // Your S3 bucket name
    region: 'us-east-1'
  },
  rekognition: {
    region: 'us-east-1'
  },
  lambda: {
    videoProcessingFunction: 'highview-video-processor',
    apiEndpoint: 'http://localhost:8000' // Local FastAPI backend
  }
}

// Student face collection for Rekognition
export const FACE_COLLECTION_ID = 'highview-students'
