import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import RelatedDoctors from "../components/RelatedDoctors";
import { toast } from "react-toastify";
import axios from "axios";

const Appointment = () => {
  const { docId } = useParams();
  const { doctors, currencySymbol, token, backendUrl, getDoctorsData } =
    useContext(AppContext);
  const navigate = useNavigate();
  const [docInfo, setDocInfo] = useState(null);
  const [docSlots, setDocSlots] = useState([]);
  const [slotIndex, setSlotIndex] = useState(0);
  const [slotTime, setSlotTime] = useState("");

  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const fetchDocInfo = async () => {
    const docInfo = await doctors.find((doc) => doc._id === docId);
    setDocInfo(docInfo);
    console.log(docInfo);
  };

  const getAvailableSlots = async () => {
    setDocSlots([]);

    //current date
    let today = new Date();
    for (let i = 0; i < 7; i++) {
      //getting date with index
      let currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      //setting end time of the date with index
      let endTime = new Date();
      endTime.setDate(today.getDate() + i);
      endTime.setHours(21, 0, 0, 0);

      //for skipping the todays slot if it crosses the end time
      let now = new Date();
      now.setSeconds(0);
      now.setMilliseconds(0);

      //Skip today if it's already past 9:00 PM
      if (i === 0 && now >= endTime) continue;

      //setting hours
      if (today.getDate() === currentDate.getDate()) {
        currentDate.setHours(
          currentDate.getHours() > 10 ? currentDate.getHours() + 1 : 10
        );
        currentDate.setMinutes(currentDate.getMinutes() > 30 ? 30 : 0); // 11:45 then set to 12:30
      } else {
        currentDate.setHours(10);
        currentDate.setMinutes(0);
      }
      let timeSlots = [];
      while (currentDate < endTime) {
        let formattedTime = currentDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      //for skip the already booked time slots logic
        let day = currentDate.getDate();
        let month = currentDate.getMonth() + 1;
        let year = currentDate.getFullYear();
        const slotDate = day + "_" + month + "_" + year;
        const slotTime = formattedTime;
        const isSlotAvailable =
          docInfo.slots_booked[slotDate] &&
          docInfo.slots_booked[slotDate].includes(slotTime)
            ? false
            : true;

        //Add the slot to the available timeSlots array only if it’s not already booked by someone 
        if (isSlotAvailable) {
          timeSlots.push({
            dateTime: new Date(currentDate),
            time: formattedTime,
          });
        }
        //increment the time by 30 min
        currentDate.setMinutes(currentDate.getMinutes() + 30);
      }
      setDocSlots((prev) => [...prev, timeSlots]);
    }
  };

  const bookAppointments = async () => {
    if (!token) {
      toast.warn("Login to book appointment");
      return navigate("/login");
    }
    try {
      const date = docSlots[slotIndex][0].dateTime;

      let day = date.getDate();
      let month = date.getMonth() + 1;
      let year = date.getFullYear();
      const slotDate = day + "_" + month + "_" + year;
      // console.log(slotDate);
      const { data } = await axios.post(
        backendUrl + "/api/user/book-appointment",
        { docId, slotDate, slotTime },
        { headers: { token } }
      );
      if (data.success) {
        toast.success(data.message);
        getDoctorsData();
        navigate("/my-appointments");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
      console.log(error.message);
    }
  };
  //When the doctors list or selected docId changes, update docInfo from context
  useEffect(() => {
    fetchDocInfo();
  }, [doctors, docId]);
  // (doctors changed)When docInfo is updated (e.g. after booking), recalculate available slots
  useEffect(() => {
    getAvailableSlots();
  }, [docInfo]); //(docid) executes and fetches slots for the newly selected doctor. and also when new doctor the user clicks then also docinfo changes
  useEffect(() => {
    console.log(docSlots);
  }, [docSlots]);

  return (
    docInfo && (
      <div>
        {/* ---------Doctor details------ */}
        <div className=" flex flex-col sm:flex-row gap-4  ">
          <div>
            <img
              className="bg-primary w-full sm:max-w-72 rounded-lg "
              src={docInfo.image}
            />
          </div>
          <div className=" flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0">
            {/* ------ Doc Info -------- */}
            <p className=" flex items-center gap-2 text-2xl font-medium text-gray-900">
              {docInfo.name} <img className=" w-5" src={assets.verified_icon} />
            </p>
            <div className=" flex  items-center gap-2 text-sm mt-1 text-gray-700">
              <p>
                {docInfo.degree} - {docInfo.speciality}
              </p>
              <button className=" py-0.5 px-2 border text-xs rounded-full">
                {docInfo.experience}
              </button>
            </div>

            {/* doctor about */}

            <div>
              <p className=" flex items-center gap-1 text-sm font-medium text-gray-900 mt-3">
                About <img src={assets.info_icon} />
              </p>
              <p className=" text-sm  text-gray-600 max-w-[700px] mt-1 ">
                {docInfo.about}
              </p>
            </div>
            <p className=" text-gray-600 font-medium mt-4">
              Appointment fee:
              <span className="text-gray-800">
                {docInfo.fees}
                {currencySymbol}
              </span>
            </p>
          </div>
        </div>

        {/* --------- Booking slots ------------ */}
        <div className=" sm:ml-72 sm:pl-4 mt-4 font-medium text-gray-700 ">
          <p>Booking slots</p>
          <div className="flex gap-3 items-center w-full overflow-x-scroll mt-4 ">
            {docSlots.length &&
              docSlots.map((item, index) => (
                <div
                  onClick={() => setSlotIndex(index)}
                  className={` text-center py-6 min-w-16 rounded-full cursor-pointer  ${
                    slotIndex === index
                      ? " bg-primary text-white"
                      : " border border-gray-200"
                  }`}
                  key={index}
                >
                  <p>{item[0] && daysOfWeek[item[0].dateTime.getDay()]}</p>
                  <p>{item[0] && item[0].dateTime.getDate()}</p>
                </div>
              ))}
          </div>

          <div className=" flex overflow-x-scroll items-center gap-3 w-full mt-4 ">
            {docSlots.length &&
              docSlots[slotIndex].map((item, _) => (
                <p
                  className={` text-sm font-light flex-shrink-0 px-5 py-2  rounded-full cursor-pointer ${
                    item.time === slotTime
                      ? " bg-primary text-white"
                      : " border border-gray-300 text-gray-500"
                  }`}
                  onClick={() => setSlotTime(item.time)}
                >
                  {item.time.toLowerCase()}
                </p>
              ))}
          </div>

          <button
            onClick={bookAppointments}
            className=" bg-primary text-white text-sm font-light px-14 py-3 rounded-full my-6"
          >
            Book an appointment
          </button>
        </div>

        {/* Related doctors */}

        <RelatedDoctors docId={docId} speciality={docInfo.speciality} />
      </div>
    )
  );
};

export default Appointment;

// [
//   [ { dateTime: "2025-02-25T10:00:00", time: "10:00 AM" },
//     { dateTime: "2025-02-25T10:30:00", time: "10:30 AM" }
//   ],  // item represents  Slots for Feb 25

//   [ { dateTime: "2025-02-26T10:00:00", time: "10:00 AM" },
//     { dateTime: "2025-02-26T10:30:00", time: "10:30 AM" }
//   ]  // Slots for Feb 26
// ]
