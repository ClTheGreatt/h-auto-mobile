import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { UserListRow } from "./UserListRow";
import type { CourseGroup, YearGroup } from "../lib/group-students";
import type { UserListItem } from "../types";

const SECTION_KEY_SEP = "::";

// React Native port of the web Users page's Course > Year > Section
// grouping (src/components/users/student-farmer-section.tsx) — same
// hierarchy, sections start collapsed, course/year headers are plain
// (never collapsible), only sections toggle.
export function StudentFarmerSection({
  courseGroups,
  onPressUser,
}: {
  courseGroups: CourseGroup[];
  onPressUser: (user: UserListItem) => void;
}) {
  const totalCount = courseGroups.reduce((sum, c) => sum + c.count, 0);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  return (
    <View className="mb-5">
      <View className="flex-row items-center mb-3">
        <Text className="text-xs font-semibold text-slate-500 uppercase">
          Student Farmer
        </Text>
        <Text className="text-xs text-slate-400 ml-2">· {totalCount}</Text>
      </View>

      {courseGroups.length === 0 ? (
        <View className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 items-center">
          <Text className="text-sm text-slate-500">No student farmers</Text>
        </View>
      ) : (
        <View className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {courseGroups.map((course, courseIdx) => (
            <CourseBlock
              key={course.key}
              course={course}
              expanded={expanded}
              onToggleSection={toggle}
              onPressUser={onPressUser}
              isLast={courseIdx === courseGroups.length - 1}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function CourseBlock({
  course,
  expanded,
  onToggleSection,
  onPressUser,
  isLast,
}: {
  course: CourseGroup;
  expanded: Set<string>;
  onToggleSection: (key: string) => void;
  onPressUser: (user: UserListItem) => void;
  isLast: boolean;
}) {
  return (
    <View className={isLast ? "" : "border-b border-slate-100"}>
      <View className="bg-slate-50 px-4 py-2.5">
        <View className="flex-row items-center">
          <Text className="text-sm font-semibold text-slate-900">
            {course.label}
          </Text>
          <Text className="text-xs text-slate-400 ml-2">
            · {course.count}
          </Text>
        </View>
      </View>

      {course.isUncategorized ? (
        <>
          <Text className="text-xs text-slate-500 px-4 pt-2">
            Missing course, year, or section information.
          </Text>
          {course.flatUsers.map((user, idx) => (
            <UserListRow
              key={user.id}
              user={user}
              divider={idx < course.flatUsers.length - 1}
              onPress={() => onPressUser(user)}
            />
          ))}
        </>
      ) : (
        course.years.map((year) => (
          <YearBlock
            key={year.key}
            courseKey={course.key}
            year={year}
            expanded={expanded}
            onToggleSection={onToggleSection}
            onPressUser={onPressUser}
          />
        ))
      )}
    </View>
  );
}

function YearBlock({
  courseKey,
  year,
  expanded,
  onToggleSection,
  onPressUser,
}: {
  courseKey: string;
  year: YearGroup;
  expanded: Set<string>;
  onToggleSection: (key: string) => void;
  onPressUser: (user: UserListItem) => void;
}) {
  return (
    <View>
      <View className="px-4 py-1.5 pl-6">
        <View className="flex-row items-center">
          <Text className="text-xs font-medium text-slate-600">
            {year.label}
          </Text>
          <Text className="text-xs text-slate-400 ml-2">· {year.count}</Text>
        </View>
      </View>

      {year.sections.map((section) => {
        const key = [courseKey, year.key, section.key].join(SECTION_KEY_SEP);
        const isOpen = expanded.has(key);
        return (
          <View key={key}>
            <Pressable
              onPress={() => onToggleSection(key)}
              className="flex-row items-center px-4 py-2 pl-9 active:bg-slate-50"
            >
              <Ionicons
                name="chevron-forward"
                size={14}
                color="#94a3b8"
                style={{
                  marginRight: 6,
                  transform: [{ rotate: isOpen ? "90deg" : "0deg" }],
                }}
              />
              <Text className="text-sm text-slate-700">
                {section.label} ({section.count} student
                {section.count === 1 ? "" : "s"})
              </Text>
            </Pressable>
            {isOpen &&
              section.users.map((user, idx) => (
                <UserListRow
                  key={user.id}
                  user={user}
                  divider={idx < section.users.length - 1}
                  onPress={() => onPressUser(user)}
                />
              ))}
          </View>
        );
      })}
    </View>
  );
}
