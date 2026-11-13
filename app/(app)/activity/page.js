import ActivityView from "./view";

export const metadata = {
  title: "Activity",
};

export default async function ActivityPage({ searchParams }) {
  return <ActivityView initial={await searchParams} />;
}
