"use client";
import React from 'react';
import Tooltip from '@uiw/react-tooltip';
import HeatMap from '@uiw/react-heat-map';
import { convertDateToString } from '@/lib/utils';
import { date } from 'drizzle-orm/pg-core';
import { count } from 'console';

type Props = {
    data: {
        createdAt: Date;
        count: number;
    }[];
};

const panelColors = ['var(--rhm-rect, #EBEDF0)',
    '#C6E48B','#7BC96F', '#239A3B', '#196127']

const SubmissionsHeatMap = (props: Props) => {
    const formattedData = props.data.map((item) => ({ 
        date: convertDateToString(item.createdAt),
        count: item.count,
    }));
        
  return (
    <HeatMap
      value={formattedData}
      width="100%"
      style={{ color: "#888"}}
      startDate={new Date('2025/01/01')}
      panelColors={panelColors}
      rectRender={(props, data) => {
        // if (!data.count) return <rect {...props} />;
        return (
          <Tooltip placement="top" content={`count: ${data.count || 0}`}>
            <rect {...props} />
          </Tooltip>
        );
      }}
    />
  )
};
export default SubmissionsHeatMap