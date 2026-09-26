import React from "react";
import { StoreId } from "../data/mockCasts";

type Props = {
  store: StoreId;
  className?: string;
};

export const StoreLogo: React.FC<Props> = ({ store, className = "h-8" }) => {
  switch (store) {
    case "rokusan_angel":
      return (
        <div className={`flex flex-col items-center justify-center font-black tracking-widest ${className}`}>
          <span className="text-[14px] leading-tight font-black bg-gradient-to-r from-[#ff2ee0] via-[#ff70ea] to-[#ffd23f] bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(255,46,224,0.4)]">
            63 ANGEL
          </span>
          <span className="text-[7px] tracking-[0.25em] text-white/70 font-bold uppercase -mt-0.5">
            ROKUSAN ANGEL
          </span>
        </div>
      );

    case "super_spark":
      return (
        <div className={`flex flex-col items-center justify-center font-black tracking-wider ${className}`}>
          <span className="text-[13px] leading-tight font-black italic bg-gradient-to-r from-[#ff9f1c] via-[#ffe45e] to-[#ff477e] bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(255,159,28,0.4)]">
            ⚡ SUPER SPARK
          </span>
          <span className="text-[7px] tracking-[0.2em] text-[#ff9f1c]/80 font-bold uppercase -mt-0.5">
            TOKYO
          </span>
        </div>
      );

    case "party_on":
      return (
        <div className={`flex flex-col items-center justify-center font-black tracking-wider ${className}`}>
          <span className="text-[13px] leading-tight font-black uppercase bg-gradient-to-r from-[#00f0ff] via-[#7000ff] to-[#ff007a] bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]">
            PARTY ON
          </span>
          <span className="text-[7px] tracking-[0.2em] text-white/70 font-bold uppercase -mt-0.5">
            BOX DISCO TOKYO
          </span>
        </div>
      );

    case "churasun6":
      return (
        <div className={`flex flex-col items-center justify-center font-black tracking-wider ${className}`}>
          <span className="text-[13px] leading-tight font-black bg-gradient-to-r from-[#ffd23f] via-[#06d6a0] to-[#118ab2] bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(255,210,63,0.4)]">
            🌺 ちゅらさん6
          </span>
          <span className="text-[7px] tracking-[0.2em] text-[#06d6a0]/80 font-bold uppercase -mt-0.5">
            CHURA SUN6 OKINAWA
          </span>
        </div>
      );

    default:
      return null;
  }
};
