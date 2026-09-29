import { useState, useCallback, useRef } from "react";
import PowerQualityTable from "../features/PowerQualityTable";
import PowerQualityGraph from "../features/PowerQualityGraph";
import MapVisualization from "../features/MapVisualization";
import PQGraph24h from "../features/PQGraph24h";
import LastOutageCard from "../features/LastOutageCard";
import GlobalStateCard from "../features/GlobalStateCard";
import LiveRefreshBar from "../components/LiveRefreshBar";
import { useBus24h, useGlobalGridState } from "../hooks/useGridData";
import { utcNow, BUS_ID } from "../utils/gridData";

const TAB_BUS    = "bus";
const TAB_GLOBAL = "global";


export default function HardPage() {
  const [targetTime, setTargetTime] = useState(utcNow);
  const [activeTab, setActiveTab] = useState(TAB_BUS);
  const [spinning, setSpinning] = useState(false);

  const { rows, isLoading: graphLoading } = useBus24h(BUS_ID, targetTime);
  const { data: globalState, isLoading: globalLoading } = useGlobalGridState(targetTime);

  const handleRefresh = useCallback(() => {
    setSpinning(true);
    setTargetTime(utcNow());
    setTimeout(() => setSpinning(false), 800);
  }, []);

  const graphData = { rows };

  const carouselRef = useRef(null);
  const dragState = useRef({ dragging: false, startX: 0, scrollLeft: 0 });

  const onMouseDown = (e) => {
    const el = carouselRef.current;
    dragState.current = { dragging: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft };
    el.style.cursor = "grabbing";
    el.style.scrollSnapType = "none";
  };
  const onMouseMove = (e) => {
    if (!dragState.current.dragging) return;
    e.preventDefault();
    const el = carouselRef.current;
    const x = e.pageX - el.offsetLeft;
    el.scrollLeft = dragState.current.scrollLeft - (x - dragState.current.startX);
  };
  const onMouseUp = () => {
    dragState.current.dragging = false;
    const el = carouselRef.current;
    el.style.cursor = "grab";
    el.style.scrollSnapType = "x mandatory";
  };

  return (
    <div>
      <LiveRefreshBar
        isLive={!graphLoading && rows.length > 0}
        isLoading={graphLoading || globalLoading}
        onRefresh={handleRefresh}
        spinning={spinning}
      />

      <div style={tabBarStyle}>
        <button style={activeTab === TAB_BUS ? activeTabStyle : tabStyle} onClick={() => setActiveTab(TAB_BUS)}>
          Your Home
        </button>
        <button style={activeTab === TAB_GLOBAL ? activeTabStyle : tabStyle} onClick={() => setActiveTab(TAB_GLOBAL)}>
          Global State
        </button>
      </div>

      {activeTab === TAB_BUS && (
        <>
          <LastOutageCard gridData={graphData} />

          <div style={{ height: "24px" }} />

          <div
            ref={carouselRef}
            style={{ display: "flex", overflowX: "auto", overflowY: "hidden", scrollSnapType: "x mandatory", scrollbarWidth: "none", msOverflowStyle: "none", gap: "16px", cursor: "grab", userSelect: "none" }}
            className="graph-carousel"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            <div style={{ minWidth: "85%", scrollSnapAlign: "center", margin: "0 auto" }}>
              <PowerQualityGraph gridData={graphData} isLoading={graphLoading} />
            </div>
            <div style={{ minWidth: "85%", scrollSnapAlign: "center", margin: "0 auto" }}>
              <PQGraph24h gridData={graphData} isLoading={graphLoading} />
            </div>
          </div>

          <div style={{ margin: "20px" }} />

          <PowerQualityTable rows={rows} />
        </>
      )}

      {activeTab === TAB_GLOBAL && (
        <div style={{ marginTop: "16px" }}>
          <GlobalStateCard data={globalState} />
          <MapVisualization />
        </div>
      )}
    </div>
  );
}

const tabStyle = {
  flex: 1, padding: "10px 0", fontSize: "14px", fontWeight: "600",
  borderTop: "1px solid #ddd", borderRight: "1px solid #ddd",
  borderBottom: "1px solid #ddd", borderLeft: "1px solid #ddd",
  borderRadius: "8px", background: "#f5f5f5", color: "#555",
  cursor: "pointer", outline: "none", appearance: "none", WebkitAppearance: "none",
};

const tabBarStyle = { display: "flex", gap: "8px", marginBottom: "4px" };
const activeTabStyle = { ...tabStyle, background: "#fff", color: "#111", borderBottom: "2px solid #2563eb" };
