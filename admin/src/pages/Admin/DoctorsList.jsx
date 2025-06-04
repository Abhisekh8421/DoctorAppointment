import React from "react";
import { useContext } from "react";
import { AdminContext } from "../../context/AdminContext";
import { useEffect } from "react";

const DoctorsList = () => {
  const { doctors, aToken, getAllDoctors, changeAvailability } =
    useContext(AdminContext);
  useEffect(() => {
    if (aToken) {
      getAllDoctors();
    }
  }, [aToken]); //prevent unnecessary or invalid API calls
  return (
    // imp to avoid Grow infinitely long, Push other components down (like the header or footer),
    <div className="m-5  max-h-[90vh] overflow-y-scroll">
      <h1 className=" text-lg font-medium">All Doctors</h1>
      {/* //flex-wrap allows flex items to wrap onto multiple lines */}
      <div className=" flex flex-wrap w-full gap-4 pt-5 gap-y-6 ">
        {doctors.map((item, index) => (
          <div
            className=" border border-indigo-200 rounded-xl max-w-56 overflow-hidden  cursor-pointer group "
            key={index}
          >
            <img
              className=" bg-indigo-50 group-hover:bg-primary transition-all duration-500"
              src={item.image}
            />
            <div className="p-4">
              <p className=" text-neutral-800 text-lg font-medium">
                {item.name}
              </p>
              <p className=" text-zinc-600 text-sm">{item.speciality}</p>
              <div className=" flex gap-1 mt-2 items-center sm-0">
                <input
                  onChange={() => changeAvailability(item._id)}
                  type="checkbox"
                  checked={item.available}
                />
                <p>Available</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DoctorsList;
