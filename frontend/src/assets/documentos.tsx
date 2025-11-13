import React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  width?: number;
  height?: number;
  fill?: string;
}

const DocumentosIcon: React.FC<IconProps> = ({ width = 24, height = 24, fill = "#fff", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    fill={fill}
    viewBox="0 0 480 480"
    {...props}
  >
    <g>
      <path 
        fill={fill} 
        d="M160 344h-16a8 8 0 0 0 0 16h16a8 8 0 0 0 0-16zM384 344H192a8 8 0 0 0 0 16h192a8 8 0 0 0 0-16zM160 296h-16a8 8 0 0 0 0 16h16a8 8 0 0 0 0-16zM384 296H192a8 8 0 0 0 0 16h192a8 8 0 0 0 0-16zM160 248h-16a8 8 0 0 0 0 16h16a8 8 0 0 0 0-16zM384 248H192a8 8 0 0 0 0 16h192a8 8 0 0 0 0-16zM160 200h-16a8 8 0 0 0 0 16h16a8 8 0 0 0 0-16zM384 200H192a8 8 0 0 0 0 16h192a8 8 0 0 0 0-16zM160 152h-16a8 8 0 0 0 0 16h16a8 8 0 0 0 0-16zM384 152H192a8 8 0 0 0 0 16h192a8 8 0 0 0 0-16z" 
      />
      <path 
        fill={fill} 
        d="M439.896 119.496a7.557 7.557 0 0 0-.408-2.056c-.088-.256-.152-.504-.264-.752a7.998 7.998 0 0 0-1.6-2.344l-112-112a7.998 7.998 0 0 0-2.344-1.6c-.248-.112-.496-.176-.744-.264a7.967 7.967 0 0 0-2.072-.416C320.328.088 320.176 0 320 0H96a8 8 0 0 0-8 8v24H48a8 8 0 0 0-8 8v432a8 8 0 0 0 8 8h336a8 8 0 0 0 8-8v-40h40a8 8 0 0 0 8-8V120c0-.176-.088-.328-.104-.504zM328 27.312 412.688 112H328V27.312zM376 464H56V48h32v376a8 8 0 0 0 8 8h280v32zm48-48H104V16h208v104a8 8 0 0 0 8 8h104v288z" 
      />
      <path 
        fill={fill} 
        d="M192 72h-48a8 8 0 0 0-8 8v48a8 8 0 0 0 8 8h48a8 8 0 0 0 8-8V80a8 8 0 0 0-8-8zm-8 48h-32V88h32v32z" 
      />
    </g>
  </svg>
);

export default DocumentosIcon;