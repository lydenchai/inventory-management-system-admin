import React from "react";
import PropTypes from "prop-types";
import DatePicker from "react-datepicker";
import { HiOutlineCalendar } from "react-icons/hi";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/DatePicker.css";

const CustomDatePicker = ({
  selected,
  onChange,
  placeholder = "Select date",
  className,
  viewOnly = false,
}) => {
  return (
    <div className={`relative w-full z-2 ${className}`}>
      <DatePicker
        selected={selected ? new Date(selected) : null}
        onChange={onChange}
        dateFormat="dd/MM/yyyy"
        placeholderText={placeholder}
        className={`w-full border rounded-lg px-3 py-2 text-gray-800 border-gray-100 text-sm ${className ? "bg-white" : "bg-gray-50"}`}
        wrapperClassName="w-full"
        showPopperArrow={false}
        disabled={viewOnly}
      />
      {!viewOnly && (
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none z-1">
          <HiOutlineCalendar className="h-5 w-5 text-gray-500" />
        </div>
      )}
    </div>
  );
};

CustomDatePicker.propTypes = {
  selected: PropTypes.any,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  viewOnly: PropTypes.bool,
};

export default CustomDatePicker;
