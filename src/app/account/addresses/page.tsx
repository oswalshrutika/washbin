import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { listAddresses } from "@/server/addresses";
import { AddressBook } from "./address-book";

export const metadata: Metadata = { title: "Saved addresses" };

export default async function AddressesPage() {
  const user = await requireUser("/account/addresses");
  const addresses = await listAddresses(user.id);
  return (
    <>
      <h1 className="text-3xl font-extrabold">Saved addresses</h1>
      <AddressBook addresses={addresses} />
    </>
  );
}
