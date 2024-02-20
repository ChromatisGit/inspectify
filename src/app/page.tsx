'use client';

import { ButtonLoginSpotify, ButtonSubmitHistory } from "@/components/button";
import { DividerHorizontal } from "@/components/divider";
import { Footer } from "@/components/footer";
import { Lang, lang } from "@/components/lang";

export default function Home() {
  return <>
    <main className="flex min-h-screen flex-col items-center p-24">
      <ButtonSubmitHistory />
      <DividerHorizontal>
        <Lang code="start.or" />
      </DividerHorizontal>
      <ButtonLoginSpotify />
    </main>
    <Footer />
  </>
}
