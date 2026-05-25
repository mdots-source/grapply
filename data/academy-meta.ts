import { currentSession } from "@/data/academy";

export const academyMeta = {
  name: "Grapply Jiu-Jitsu Academy",
  shortName: "Grapply Jiu-Jitsu",
  location: "San Diego, CA",
  tagline: "Competition-focused Brazilian Jiu-Jitsu",
  memberCount: 212,
  checkedInToday: 47,
  academyPulse: 89,
  liveClass: {
    name: currentSession.name,
    coach: currentSession.coach,
    room: currentSession.room,
    time: `${currentSession.time}–${currentSession.endTime}`,
    trainingType: currentSession.trainingType,
  },
};

export const tvTickerItems = [
  "Mike Johnson checked in · Advanced No-Gi",
  "Open Mat starts in 20 minutes · Main Mat",
  "Noah Keller received 4th stripe on Black Belt",
  "IBJJF LA Open registration closes in 8 days",
  "Maya Ribeiro on a 9-class attendance streak",
  "47 athletes checked in today at Grapply Jiu-Jitsu",
  "Competition Team capacity at 89% this week",
];
