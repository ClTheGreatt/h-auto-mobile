import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../../constants/colors";
import { getUser } from "../../../lib/auth";
import type { User, UserRole } from "../../../types";

type Guide = { title: string; steps: string[] };
type FaqItem = { question: string; answer: string };
type HelpSection = { title: string; roles: UserRole[]; guides: Guide[] };

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  FACULTY: "Faculty",
  STUDENT_FARMER: "Student Farmer",
};

const ADMIN_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN"];
const FACULTY_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN", "FACULTY"];
const ALL_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "FACULTY",
  "STUDENT_FARMER",
];

const HELP_SECTIONS: HelpSection[] = [
  {
    title: "Administration",
    roles: ADMIN_ROLES,
    guides: [
      {
        title: "Add a new user",
        steps: [
          "Go to the Profile tab and tap 'Manage Users'",
          "Tap the '+' button (top-right) to add a user",
          "Fill in personal information (name, email, phone)",
          "Select the appropriate role: Admin, Faculty, or Student Farmer",
          "For students: fill in course, year, and section",
          "Tap 'Create account' — there's no password to set. The system generates a temporary password, shows it once on screen, and emails it to the user",
        ],
      },
      {
        title: "Register an ESP32 device",
        steps: [
          "This is done on the web dashboard (Devices), not in this mobile app. Ask an admin with web access to register new devices.",
        ],
      },
      {
        title: "Add a crop profile with thresholds",
        steps: [
          "This is done on the web dashboard (Crops), not in this mobile app.",
        ],
      },
      {
        title: "Bulk import users",
        steps: [
          "Go to the Profile tab and tap 'Manage Users'",
          "Tap the upload icon (top-right)",
          "Choose Faculty or Student Farmers, then pick a .csv or .xlsx file",
          "Review the preview — rows with errors are flagged and skipped automatically",
          "Tap 'Import' to create the valid rows",
          "Temporary passwords for each new account are shown once on screen, and also emailed",
        ],
      },
    ],
  },
  {
    title: "Faculty",
    roles: FACULTY_ROLES,
    guides: [
      {
        title: "Assign students to plots",
        steps: [
          "Go to the Plots tab and tap a specific plot",
          "Scroll to 'Monitoring Assignments'",
          "Tap 'Assign student'",
          "Search and select a student farmer from the list",
          "The student will now see this plot on their Home screen",
        ],
      },
      {
        title: "Monitor student activity",
        steps: [
          "Recent submissions across your plots appear in 'Recent Activity' on the Home tab",
          "Tap any plot from the Plots tab to see its full growth log history with photos",
          "A full cross-plot monitoring timeline is available on the web dashboard",
        ],
      },
      {
        title: "Track plot performance with drill-down",
        steps: [
          "Tap the Analytics tab",
          "View sensor trends, observation activity, and alert patterns",
          "Filter by time range (24h, 7 days, 30 days, all time)",
          "Tap any bar on the Daily Activity chart to see who logged observations that day",
          "Tap an observation in the list to jump directly to that plot",
        ],
      },
    ],
  },
  {
    title: "Student Farmers",
    roles: ALL_ROLES,
    guides: [
      {
        title: "View your assigned plots",
        steps: [
          "Your assigned plots appear on the Plots tab",
          "Tap any plot card to see full details",
          "View current sensor readings, growth stage, and history",
          "Faculty assignments are shown on the plot's detail screen",
        ],
      },
      {
        title: "Log plant growth with photos",
        steps: [
          "Go to your plot's detail page",
          "Tap 'Log observation'",
          "Select the current growth stage",
          "Enter plant height and leaf count",
          "Write observations and any notes",
          "Upload up to 4 photos of the plants",
          "Tap 'Submit observation' — the current sensor readings are automatically captured as a snapshot with your entry, giving you a permanent record of the conditions at that moment",
        ],
      },
      {
        title: "Respond to alerts with guidance",
        steps: [
          "Critical alerts appear in the Alerts tab and send a push notification to your mobile app",
          "Tap or click any alert to see the full context — sensor readings, plot details, and time",
          "Every alert now includes a 'Suggested action' with step-by-step guidance on how to respond",
          "Follow the suggested steps (water, shade, ventilate, fertilize, depending on the alert type)",
          "Sensor readings will auto-resolve the alert when values return to the optimal range, or you can manually resolve it",
        ],
      },
    ],
  },
  {
    title: "Mobile App",
    roles: ALL_ROLES,
    guides: [
      {
        title: "Install the mobile companion app",
        steps: [
          "Ask your administrator for the H-Auto mobile app APK",
          "On your Android device, tap the APK to install (you may need to allow 'Install from unknown sources')",
          "Open the app and log in with your H-Auto credentials",
          "Allow notifications when prompted — this enables push alerts",
        ],
      },
      {
        title: "Log observations from the field",
        steps: [
          "Open the app and tap a plot from your plots list",
          "Tap 'Log observation'",
          "Take photos directly with your phone camera",
          "Add growth stage, plant height, leaves, and notes",
          "Save — the entry syncs to the web dashboard immediately",
        ],
      },
      {
        title: "Analytics on your phone",
        steps: [
          "Tap the Analytics tab at the bottom",
          "Choose a time range (24h, 7 days, 30 days, all time)",
          "Tap a bar on the Daily Activity chart to see the observations logged that day",
          "Tap an observation row to jump directly to that plot",
        ],
      },
    ],
  },
  {
    title: "Common Tasks",
    roles: ALL_ROLES,
    guides: [
      {
        title: "Export reports",
        steps: [
          "This is done on the web dashboard (Reports), not in this mobile app.",
        ],
      },
      {
        title: "Read sensor analytics",
        steps: [
          "Tap the Analytics tab",
          "Stat cards show total readings and observations, plus average sensor values",
          "Line charts plot soil moisture, temperature, humidity, and NPK over time",
          "Bar charts show daily observation activity and alerts",
          "Switch time ranges to see different periods",
        ],
      },
    ],
  },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Why does my sensor show 0% soil moisture?",
    answer:
      "A reading of 0% means the sensor is in dry air or not fully inserted into moist soil. Push the sensor probes deeper into the soil (at least 3-4 cm) and check readings after 30 seconds.",
  },
  {
    question: "My ESP32 shows OFFLINE. What do I do?",
    answer:
      "Check that (1) the device has power, (2) it's within Wi-Fi range, and (3) the Wi-Fi network is a 2.4GHz network — ESP32 does not support 5GHz. Devices are marked ONLINE within a few minutes of powering on.",
  },
  {
    question: "Why don't I see NPK values on some plots?",
    answer:
      "NPK values only appear on plots whose assigned ESP32 device has an NPK sensor connected. Plots with soil moisture and DHT22 only will show blank for the NPK fields.",
  },
  {
    question: "Can I edit an observation after saving?",
    answer:
      "Growth log entries are immutable once saved to preserve the integrity of the historical record. The sensor snapshot captured with each entry is also permanent. If you made a mistake, log a new entry with the correction and note the reason.",
  },
];

export default function Help() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    getUser().then(setUser);
  }, []);

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-stone-50 items-center justify-center">
        <ActivityIndicator color={colors.brand[600]} />
      </SafeAreaView>
    );
  }

  const visibleSections = HELP_SECTIONS.filter((section) =>
    section.roles.includes(user.role),
  );

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
          Help
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-2">
          <Text className="text-2xl font-bold text-slate-900">
            Help & Documentation
          </Text>
          <Text className="text-sm text-slate-500 mt-1">
            Step-by-step guides for using H-Auto effectively.
          </Text>
        </View>

        {/* Role tip banner */}
        <View className="px-6 mt-3">
          <View
            className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex-row items-start"
            style={{ gap: 8 }}
          >
            <Ionicons name="information-circle" size={18} color="#b45309" />
            <Text className="flex-1 text-xs text-amber-800">
              Your role determines what you can see and do. You are signed in
              as{" "}
              <Text className="font-semibold">
                {ROLE_LABELS[user.role] ?? user.role}
              </Text>
              . Sections below are filtered to your role.
            </Text>
          </View>
        </View>

        {/* Role-gated guide sections */}
        {visibleSections.map((section) => (
          <Section key={section.title} title={section.title}>
            <View style={{ gap: 8 }}>
              {section.guides.map((guide) => (
                <GuideCard key={guide.title} guide={guide} />
              ))}
            </View>
          </Section>
        ))}

        {/* FAQ */}
        <Section title="FAQ">
          <View style={{ gap: 8 }}>
            {FAQ_ITEMS.map((item) => (
              <FaqCard key={item.question} item={item} />
            ))}
          </View>
        </Section>

        {/* Need more help? */}
        <View className="px-6 mt-6">
          <View className="bg-brand-50 border border-brand-100 rounded-2xl p-5">
            <View className="flex-row items-center gap-2 mb-1.5">
              <Ionicons
                name="help-buoy-outline"
                size={18}
                color={colors.brand[600]}
              />
              <Text className="text-sm font-semibold text-slate-900">
                Need more help?
              </Text>
            </View>
            <Text className="text-xs text-slate-600 leading-4">
              Contact your system administrator for physical hardware
              installation and setup, sensor calibration, adding new ESP32
              devices to plots, or troubleshooting persistent offline devices.
              Reach out to your assigned faculty or the system administrator
              through your usual campus channels.
            </Text>
          </View>
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

function GuideCard({ guide }: { guide: Guide }) {
  return (
    <View className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <Text className="text-sm font-semibold text-slate-900 mb-2">
        {guide.title}
      </Text>
      <View style={{ gap: 4 }}>
        {guide.steps.map((step, i) => (
          <View key={i} className="flex-row">
            <Text className="text-xs text-slate-400 w-5">{i + 1}.</Text>
            <Text className="text-xs text-slate-600 flex-1 leading-4">
              {step}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function FaqCard({ item }: { item: FaqItem }) {
  return (
    <View className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <View className="flex-row items-start">
        <Text className="text-xs font-bold text-brand-700 mr-2">Q:</Text>
        <Text className="flex-1 text-sm font-semibold text-slate-900">
          {item.question}
        </Text>
      </View>
      <View className="flex-row items-start mt-2">
        <Text className="text-xs font-bold text-slate-400 mr-2">A:</Text>
        <Text className="flex-1 text-xs text-slate-600 leading-4">
          {item.answer}
        </Text>
      </View>
    </View>
  );
}
