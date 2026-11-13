import CustomersView from "./view";

export const metadata = {
  title: "Customers",
};

export default async function CustomersPage({ searchParams }) {
  return <CustomersView initial={await searchParams} />;
}
