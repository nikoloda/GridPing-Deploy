import { useState, useEffect, useCallback } from "react";
import Dial_PQ from "../features/PQDial";
import ChargeForecast from "../features/ChargeForecast";
import GridWidePQ from "../features/GridWidePQ";
import ApplianceCarousel from "../features/ApplianceCarousel";
import LiveRefreshBar from "../components/LiveRefreshBar";
import { useGridData } from "../hooks/useGridData";
import { pqToPercent, utcNow, BUS_ID, PQ_PROFILE } from "../utils/gridData";

export default function EasyPage() {
  const [pq, setPq] = useState(65);
  const [targetTime, setTargetTime] = useState(utcNow);
  const [spinning, setSpinning] = useState(false);

  const { data, isLoading } = useGridData(BUS_ID, targetTime);

  useEffect(() => {
    const id = setInterval(() => setTargetTime(utcNow()), 30000);
    return () => clearInterval(id);
  }, []);

  const handleRefresh = useCallback(() => {
    setSpinning(true);
    setTargetTime(utcNow());
    setTimeout(() => setSpinning(false), 800);
  }, []);

  return (
    <div>
      <LiveRefreshBar
        isLive={!isLoading && !!data}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        spinning={spinning}
      />
      <Dial_PQ
        pq={pqToPercent(data?.power_quality, PQ_PROFILE)}
        rawPq={data?.power_quality}
        onValueChange={setPq}
        recordTime={data?.record_time}
      />
      <ChargeForecast pq={pq} rawPq={data?.power_quality} />
      <GridWidePQ />
      <ApplianceCarousel />
    </div>
  );
}
