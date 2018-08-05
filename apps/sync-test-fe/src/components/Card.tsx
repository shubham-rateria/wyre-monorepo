import { Typography } from "antd";
import React from "react";
import "./Card.css";

type Props = {
  title: string;
  children: React.ReactNode;
};

const Card: React.FC<Props> = ({ title, children }) => {
  return (
    <div className="CardContainer">
      <Typography.Title level={3}>{title}</Typography.Title>
      <div>{children}</div>
    </div>
  );
};

export default Card;
