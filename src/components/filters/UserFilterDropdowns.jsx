import React from "react";
import PropTypes from "prop-types";
import { Listbox } from "@headlessui/react";
import { HiSelector } from "react-icons/hi";

export function PermissionDropdown({
  selected,
  setSelected,
  permissionOptions: permissions,
}) {
  return (
    <Listbox value={selected} onChange={setSelected}>
      <div className="relative">
        <Listbox.Button className="cursor-pointer w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-left text-gray-900 text-sm flex items-center justify-between">
          <span>
            {permissions.find((p) => p._id === selected)?.name || "All Roles"}
          </span>
          <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
        </Listbox.Button>
        <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
          {permissions.map((option) => (
            <Listbox.Option
              key={option._id}
              value={option._id}
              className={({ selected }) =>
                `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] rounded-lg ${selected ? "bg-[#1e3a5f] text-white" : ""}`
              }
            >
              {option.name}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
  );
}

PermissionDropdown.propTypes = {
  selected: PropTypes.string.isRequired,
  setSelected: PropTypes.func.isRequired,
  permissionOptions: PropTypes.array.isRequired,
};

export function TypesDropdown({ selected, setSelected }) {
  const types = ["internal", "external"];
  return (
    <Listbox value={selected} onChange={setSelected}>
      <div className="relative">
        <Listbox.Button className="cursor-pointer w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-left text-gray-900 text-sm flex items-center justify-between">
          <span className="capitalize">
            {selected ? selected : "All Types"}
          </span>
          <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
        </Listbox.Button>
        <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
          <Listbox.Option
            value=""
            className={({ selected }) =>
              `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] rounded-lg capitalize ${selected ? "bg-[#1e3a5f] text-white" : ""}`
            }
          >All Types</Listbox.Option>
          {types.map((s) => (
            <Listbox.Option
              key={s}
              value={s}
              className={({ selected }) =>
                `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] rounded-lg capitalize ${selected ? "bg-[#1e3a5f] text-white" : ""}`
              }
            >
              {s}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
  );
}

TypesDropdown.propTypes = {
  selected: PropTypes.string.isRequired,
  setSelected: PropTypes.func.isRequired,
};

export function UserStatusDropdown({ selected, setSelected }) {
  const statuses = ["active", "inactive", "pending"];
  return (
    <Listbox value={selected} onChange={setSelected}>
      <div className="relative">
        <Listbox.Button className="cursor-pointer w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-left text-gray-900 text-sm flex items-center justify-between">
          <span className="capitalize">
            {selected ? selected : "All Status"}
          </span>
          <HiSelector className="w-5 h-5 text-gray-400 ml-2" />
        </Listbox.Button>
        <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
          <Listbox.Option
            value=""
            className={({ selected }) =>
              `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] rounded-lg capitalize ${selected ? "bg-[#1e3a5f] text-white" : ""}`
            }
          >All Status</Listbox.Option>
          {statuses.map((s) => (
            <Listbox.Option
              key={s}
              value={s}
              className={({ selected }) =>
                `px-3 py-2 cursor-pointer text-[#64748b] text-sm hover:text-gray-900 hover:bg-[#f1f5f9] rounded-lg capitalize ${selected ? "bg-[#1e3a5f] text-white" : ""}`
              }
            >
              {s}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
  );
}

UserStatusDropdown.propTypes = {
  selected: PropTypes.string.isRequired,
  setSelected: PropTypes.func.isRequired,
};
