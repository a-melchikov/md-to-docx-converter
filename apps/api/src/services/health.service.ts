const SERVICE_NAME = "md-to-docx-api";

export interface HealthResponse {
  status: "ok";
  service: typeof SERVICE_NAME;
}

export interface ReadinessResponse {
  status: "ready";
  service: typeof SERVICE_NAME;
}

export function getHealthStatus(): HealthResponse {
  return {
    service: SERVICE_NAME,
    status: "ok"
  };
}

export function getReadinessStatus(): ReadinessResponse {
  return {
    service: SERVICE_NAME,
    status: "ready"
  };
}
