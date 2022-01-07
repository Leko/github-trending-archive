import { useEffect, useRef, useState } from "react";
import { useIntersection } from "react-use";

type Props = {
  slug: string; // "owner/name"
  date: string; // "owner/name"
  width: number | string;
  height?: number | string;
};

export function RepositoryStats(props: Props) {
  const { slug, date, width, height = 160 } = props;
  const [initialized, setInitialized] = useState(false);
  const intersectionRef = useRef(null);
  const chartRef = useRef(null);
  const intersection = useIntersection(intersectionRef, {
    root: null,
    rootMargin: "0px",
    threshold: 1,
  });

  useEffect(() => {
    setInitialized((prev) => !!(prev || intersection?.isIntersecting));
  }, [setInitialized, intersection?.isIntersecting]);

  useEffect(() => {
    if (!initialized) {
      return;
    }
    Promise.all([
      import("apexcharts").then((mod) => mod.default),
      fetch(`/api/stats?slug=${slug}&date=${date}`, {}).then((res) =>
        res.json()
      ),
    ] as const).then(([ApexCharts, data]) => {
      const formatter = new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
      });
      const chart = new ApexCharts(chartRef.current, {
        chart: {
          type: "line",
          width,
          height,
          animations: { enabled: false },
          toolbar: { show: false },
        },
        stroke: { curve: "smooth" },
        series: [
          {
            type: "line",
            data: data.map((d: { date: string; value: number }) => d.value),
          },
        ],
        xaxis: {
          categories: data.map((d: { date: string; value: number }) => {
            const date = new Date(d.date);
            if (date.getHours() === 0) {
              return formatter.format(date).slice(0, -6);
            }
            return "";
          }),
        },
        tooltip: { enabled: false },
      });
      chart.render();
    });
  }, [initialized, slug, date]);

  return (
    <div style={{ padding: 1 }}>
      <div ref={intersectionRef} style={{ width, height }}>
        <div ref={chartRef} />
      </div>
    </div>
  );
}
