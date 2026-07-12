import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../../constants/colors";

type TeamMember = {
  name: string;
  role: string;
  badge?: string;
};

type Feature = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
};

type TechCategory = {
  category: string;
  items: string;
};

const ABOUT_PARAGRAPHS = [
  "H-Auto is a comprehensive web-based monitoring system designed for educational gardens. It combines IoT sensor technology with a modern web platform to enable real-time monitoring, data analytics, and automated alerting for vegetable cultivation.",
  "The system was developed as a capstone project to address the challenge of effective garden management in academic settings, where multiple students share responsibility for plot care under faculty supervision. By providing continuous environmental monitoring and instant alert notifications, H-Auto helps prevent crop loss and improves learning outcomes through data-driven cultivation.",
];

const PROJECT_PURPOSE =
  "H-Auto addresses the challenge of collaborative garden management in academic settings, where students share responsibility for plot care under faculty supervision. By combining continuous environmental monitoring with actionable alert guidance, the system reduces crop loss, teaches data-driven cultivation, and creates a shared, transparent record of plant care that faculty can review at any time.";

const INSTITUTION = [
  "Bataan Peninsula State University",
  "College of Computer Studies",
  "Bachelor of Science in Information Technology",
  "Academic Year 2025-2026",
];

const TEAM: TeamMember[] = [
  {
    name: "Chrislord Dizon",
    role: "Lead Developer & System Architect",
    badge: "Developer",
  },
  { name: "Said Hussin", role: "Documentation & Research" },
  { name: "Geoffrey Perello", role: "Documentation & Research" },
  { name: "Jhan Criss Alba", role: "Documentation & Research" },
];

const FEATURES: Feature[] = [
  {
    icon: "hardware-chip-outline",
    title: "Real-time IoT Monitoring",
    description:
      "ESP32 microcontroller with soil moisture, temperature, humidity, and NPK sensors continuously stream readings to the cloud.",
  },
  {
    icon: "notifications-outline",
    title: "Multi-channel Smart Alerts",
    description:
      "Automatic alerts when readings cross thresholds, delivered via SMS, push notifications, email, and in-app inbox. Each alert includes actionable step-by-step guidance for the user.",
  },
  {
    icon: "phone-portrait-outline",
    title: "Mobile Companion App",
    description:
      "React Native app for field workers to log observations, view analytics, and receive push notifications on the go.",
  },
  {
    icon: "document-text-outline",
    title: "Comprehensive Reporting",
    description:
      "Role-based PDF and Excel exports for sensor data, plot performance, growth logs, alerts, and student activity.",
  },
];

const TECH_STACK: TechCategory[] = [
  {
    category: "Web Platform",
    items: "Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui",
  },
  {
    category: "Mobile Platform",
    items: "React Native, Expo, NativeWind, TanStack Query",
  },
  {
    category: "Backend & Data",
    items: "Node.js, Prisma ORM, PostgreSQL (Neon), NextAuth v5",
  },
  {
    category: "Cloud Services",
    items:
      "Vercel, Neon Database, Cloudinary, Expo Push Notifications, Semaphore SMS, Resend Email",
  },
  {
    category: "IoT Hardware",
    items:
      "ESP32 DevKit, YL-69 Soil Moisture Sensor, DHT22 Temperature/Humidity, NPK RS485 Modbus Sensor",
  },
  {
    category: "Reporting & Charts",
    items: "Recharts, React-PDF, ExcelJS",
  },
];

const FOOTER_LINES = [
  "AY 2025-2026",
  "© 2026 H-Auto Development Team",
  "Bataan Peninsula State University",
];

export default function About() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-stone-50" edges={["top"]}>
      <View className="flex-row items-center px-4 py-3 bg-stone-50 border-b border-slate-100">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full active:bg-slate-200"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text className="flex-1 text-lg font-semibold text-slate-900 ml-2">
          About
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View className="items-center px-6 pt-8 pb-2">
          <View className="w-16 h-16 rounded-2xl bg-brand-600 items-center justify-center mb-4 shadow-lg">
            <Text className="text-3xl">🌱</Text>
          </View>
          <Text className="text-2xl font-bold text-slate-900">H-Auto</Text>
          <Text className="text-sm text-slate-500 text-center mt-2 px-4">
            Online Smart Gardening Monitoring System for Vegetables using
            Microcontrollers
          </Text>
          <View className="mt-3 px-3 py-1 rounded-full bg-brand-100">
            <Text className="text-xs font-semibold text-brand-700">v1.0</Text>
          </View>
        </View>

        {/* About this project */}
        <Section title="About this project">
          <View
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
            style={{ gap: 10 }}
          >
            {ABOUT_PARAGRAPHS.map((p, i) => (
              <Text key={i} className="text-sm text-slate-600 leading-5">
                {p}
              </Text>
            ))}
          </View>
        </Section>

        {/* Project purpose */}
        <Section title="Project purpose">
          <View className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <Text className="text-sm text-slate-600 leading-5">
              {PROJECT_PURPOSE}
            </Text>
          </View>
        </Section>

        {/* Institution */}
        <Section title="Institution">
          <View className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {INSTITUTION.map((line, i) => (
              <View
                key={line}
                className={`flex-row items-center px-5 py-4 ${
                  i > 0 ? "border-t border-slate-100" : ""
                }`}
              >
                <Ionicons
                  name="school-outline"
                  size={18}
                  color={colors.brand[600]}
                />
                <Text className="flex-1 ml-3 text-sm text-slate-700">
                  {line}
                </Text>
              </View>
            ))}
          </View>
        </Section>

        {/* Development team */}
        <Section title="Development team">
          <View style={{ gap: 8 }}>
            {TEAM.map((member) => (
              <TeamCard key={member.name} member={member} />
            ))}
          </View>
        </Section>

        {/* Key features */}
        <Section title="Key features">
          <View style={{ gap: 8 }}>
            {FEATURES.map((feature) => (
              <FeatureCard key={feature.title} feature={feature} />
            ))}
          </View>
        </Section>

        {/* Technology stack */}
        <Section title="Technology stack">
          <View className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {TECH_STACK.map((tech, i) => (
              <View
                key={tech.category}
                className={`px-5 py-4 ${
                  i > 0 ? "border-t border-slate-100" : ""
                }`}
              >
                <Text className="text-sm font-semibold text-slate-900">
                  {tech.category}
                </Text>
                <Text className="text-xs text-slate-500 mt-1">
                  {tech.items}
                </Text>
              </View>
            ))}
          </View>
        </Section>

        {/* Footer */}
        <View className="items-center mt-8 px-6">
          {FOOTER_LINES.map((line, i) => (
            <Text key={i} className="text-xs text-slate-400 mt-0.5">
              {line}
            </Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="px-6 mt-6">
      <Text className="text-xs font-semibold text-slate-500 uppercase mb-3">
        {title}
      </Text>
      {children}
    </View>
  );
}

function TeamCard({ member }: { member: TeamMember }) {
  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex-row items-center">
      <View className="w-11 h-11 rounded-full bg-brand-100 items-center justify-center">
        <Text className="text-sm font-semibold text-brand-700">
          {initials}
        </Text>
      </View>
      <View className="flex-1 ml-3">
        <Text className="text-sm font-semibold text-slate-900">
          {member.name}
        </Text>
        <Text className="text-xs text-slate-500 mt-0.5">{member.role}</Text>
      </View>
      {member.badge && (
        <View className="px-2.5 py-1 rounded-full bg-brand-50 border border-brand-100">
          <Text className="text-[10px] font-semibold text-brand-700 uppercase">
            {member.badge}
          </Text>
        </View>
      )}
    </View>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <View className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex-row items-start">
      <View className="w-9 h-9 rounded-full bg-brand-100 items-center justify-center mt-0.5">
        <Ionicons name={feature.icon} size={18} color={colors.brand[600]} />
      </View>
      <View className="flex-1 ml-3">
        <Text className="text-sm font-semibold text-slate-900">
          {feature.title}
        </Text>
        <Text className="text-xs text-slate-500 mt-1 leading-4">
          {feature.description}
        </Text>
      </View>
    </View>
  );
}
