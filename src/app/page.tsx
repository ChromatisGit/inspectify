'use client';

import { ButtonLoginSpotify, ButtonSubmitHistory } from "@/components/button";
import { DividerHorizontal } from "@/components/divider";
import { Footer } from "@/components/footer";
import { Lang, langFlat } from "@/components/lang";
import { toast, ToastContainer } from 'react-toastify';

import 'react-toastify/dist/ReactToastify.css';
import { useInternalState } from "@/components/provider";

export default function Home() {
  const [internalState, _] = useInternalState();

  const throwError = (code: string) => {
    const str = langFlat(internalState?.lang, code)
    toast.error(str,{
        position: "bottom-center"
      })
  }

  const sendMessage = (code: string) => {
    const str = langFlat(internalState?.lang, code)
    toast.success(str,{
        position: "bottom-center"
      })
  }

  return <>
    <main className="flex min-h-screen flex-col items-center p-24">
      <ButtonSubmitHistory callbackError={throwError} callbackSuccess={sendMessage}/>
      <DividerHorizontal>
        <Lang code="start.or" />
      </DividerHorizontal>
      <ButtonLoginSpotify />
    </main>
    <ToastContainer
    position="bottom-center"
    hideProgressBar={true}
    newestOnTop={true}
    autoClose={8000}
    theme="colored"
    />
    <Footer />
  </>
}
