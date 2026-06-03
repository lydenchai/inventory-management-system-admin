import React from "react";
import PropTypes from "prop-types";

export default function PageHeader({ title, description, actions }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex flex-col">
        <h1 className="text-xl font-semibold">{title}</h1>
        {description && (
          <span className="text-gray-500 text-sm">{description}</span>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  actions: PropTypes.node,
};
