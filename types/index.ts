// types/index.ts
export type UserRole = "SUPER_ADMIN" | "ADMIN" | "FACULTY" | "STUDENT_FARMER";

export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export type User = {
  id: string;
  email: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  phoneNumber: string | null;
  role: UserRole;
  status: UserStatus;
  idNumber: string | null;
  department: string | null;
  course: string | null;
  yearLevel: string | null;
  section: string | null;
  position: string | null;
  profileImage: string | null;
};

export type PlotStatus =
  | "PREPARING"
  | "PLANTED"
  | "GROWING"
  | "READY_FOR_HARVEST"
  | "HARVESTED"
  | "FALLOW"
  | "ARCHIVED";

export type Plot = {
  id: string;
  name: string;
  location: string | null;
  cropName: string | null;
  status: PlotStatus;
  plantingDate: string | null;
  expectedHarvest: string | null;
  openAlertsCount: number;
};

export type Alert = {
  id: string;
  plotId: string;
  plotName: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  message: string;
  isOpen: boolean;
  createdAt: string;
};

export type LoginResponse = {
  user: User;
  token: string;
};

export type SensorReading = {
  id: string;
  recordedAt: string;
  soilMoisture: number | null;
  temperature: number | null;
  humidity: number | null;
  lightIntensity: number | null;
  nitrogen: number | null;
  phosphorus: number | null;
  potassium: number | null;
};

export type Observation = {
  id: string;
  plantHeightCm: number | null;
  leafCount: number | null;
  soilMoisture: number | null;
  temperature: number | null;
  humidity: number | null;
  lightIntensity: number | null;
  nitrogen: number | null;
  phosphorus: number | null;
  potassium: number | null;
  observations: string | null;
  notes: string | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
  stage: {
    name: string;
  } | null;
  images: { imageUrl: string }[]; // ← ADD THIS
};

export type PlotDetail = {
  id: string;
  name: string;
  location: string | null;
  status: PlotStatus;
  sizeSqm: number | null;
  plantingDate: string | null;
  expectedHarvest: string | null;
  crop: {
    id: string;
    name: string;
    variety: string | null;
    daysToHarvest: number;
  } | null;
  currentStage: {
    id: string;
    name: string;
    orderIndex: number;
  } | null;
  adviser: { id: string; firstName: string; lastName: string } | null;
  canManageAssignments: boolean;
  device: {
    deviceCode: string;
    status: string;
    lastSeenAt: string | null;
  } | null;
  latestReading: SensorReading | null;
  openAlertsCount: number;
  observations: Observation[];
};

export type AlertSeverity = "CRITICAL" | "WARNING" | "INFO";

export type AlertItem = {
  id: string;
  type: string;
  severity: AlertSeverity;
  message: string;
  resolved: boolean;
  resolvedAt: string | null;
  createdAt: string;
  plot: {
    id: string;
    name: string;
  };
  suggestionTitle: string | null;
  suggestionSteps: string[];
};

export type DashboardData = {
  stats: {
    plots: number;
    openAlerts: number;
    myObservations: number;
    todaysObservations: number;
  };
  urgentAlerts: {
    id: string;
    severity: AlertSeverity;
    message: string;
    createdAt: string;
    plot: { id: string; name: string };
  }[];
  recentActivity: {
    id: string;
    observations: string | null;
    createdAt: string;
    plot: { id: string; name: string };
    user: { firstName: string; lastName: string };
    images: { imageUrl: string }[];
  }[];
};
export type UserStats = {
  observations: number;
  plotsAssigned: number;
  daysActive: number;
  memberSince: string | null;
  lastLoginAt: string | null;
};

export type ActivityBucket = {
  label: string;
  value: number;
  bucketStart: string;
};

export type AnalyticsData = {
  summary: {
    totalReadings: number;
    totalObservations: number;
    avgSoilMoisture: number | null;
    avgTemperature: number | null;
    avgHumidity: number | null;
    avgLightIntensity: number | null;
    avgNitrogen: number | null;
    avgPhosphorus: number | null;
    avgPotassium: number | null;
  };
  availableMonths?: string[];
  bucketMs: number;
  alertsByDay: {
    availableMonths?: string[];
    label: string;
    critical: number;
    warning: number;
    info: number;
  }[];
  observationsByDay: ActivityBucket[];
  soilMoistureByDay: { label: string; value: number }[];
  temperatureByDay: { label: string; value: number }[];
  humidityByDay: { label: string; value: number }[];
  lightByDay: { label: string; value: number }[];
  nitrogenByDay: { label: string; value: number }[];
  phosphorusByDay: { label: string; value: number }[];
  potassiumByDay: { label: string; value: number }[];
  statusDistribution: Record<string, number>;
};

export type UserListItem = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  department: string | null;
  idNumber: string | null;
  profileImage: string | null;
  lastLoginAt: string | null;
  createdAt: string;
};

export type UserDetail = UserListItem & {
  middleName: string | null;
  phoneNumber: string | null;
  course: string | null;
  yearLevel: string | null;
  section: string | null;
  position: string | null;
  updatedAt: string;
};

export type StudentListItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  course: string | null;
  yearLevel: string | null;
  section: string | null;
  profileImage: string | null;
};

export type PlotAssignment = {
  id: string;
  studentId: string;
  facultyId: string;
  notes: string | null;
  assignedAt: string;
  student: StudentListItem;
  faculty: {
    id: string;
    firstName: string;
    lastName: string;
  };
};
