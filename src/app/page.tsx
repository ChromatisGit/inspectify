import Image from "next/image";
import { ButtonLoginSpotify, ButtonSubmitHistory } from "@/components/button";
import { DividerHorizontal } from "@/components/divider";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <ButtonSubmitHistory />
      <DividerHorizontal>
        or
      </DividerHorizontal>
      <ButtonLoginSpotify />
    </main>
  );
}
