//Overview
import {
  Activity,
  AlertTriangle,
  MapPin,
  RadioIcon,
  Trash,
} from "lucide-react";
import React from "react";
import dynamic from "next/dynamic";

const TowerMap = dynamic(() => import("./TowerMap"), {
  ssr: false,
});

export default function Overview({user, towers, onDelete , stats }) {
  return (
    <div>
      <div className="w-full p-2 grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl text-center  p-4 border-r-4 border-r-red-500">
          <AlertTriangle className="mx-auto" size={40} color="red" />
          <p className="text-gray-500 my-3 text-xl">عطل خطير</p>
          <p className="font-bold text-3xl text-red-500">{/*{stats.critical}*/}</p>
        </div>
        <div className="bg-white rounded-2xl text-center p-4 border-r-4 border-r-yellow-500">
          <AlertTriangle className="mx-auto text-yellow-500" size={40} />
          <p className="text-gray-500 my-3 text-xl"> تحذير</p>
          <p className="font-bold text-3xl text-yellow-500">{/*{stats.warning}*/}</p>
        </div>
        <div className="bg-white rounded-2xl text-center p-4 border-r-4 border-r-green-500">
          <Activity className="mx-auto  text-green-500" size={40} />
          <p className="text-gray-500 my-3 text-xl"> طبيعي</p>
          <p className="font-bold text-3xl text-green-500">{/*{stats.normal}*/}</p>
        </div>
        <div className="bg-white rounded-2xl text-center p-4 border-r-4 border-r-blue-500">
          <RadioIcon className="mx-auto text-blue-500" size={40} />
          <p className="text-gray-500 my-3 text-xl">جميع الابراج</p>
          <p className="font-bold text-3xl text-blue-500">{/*{towers.length}*/}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 my-12">
        <div className="xl:col-span-3 bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <MapPin className="text-indigo-600" />
            خريطة الأبراج
          </h2>
          <div className="h-96 rounded-xl overflow-hidden border border-gray-200">
            <TowerMap towers={towers} />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-center font-bold text-3xl py-4">
          جميع الابراج المراقبة
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {towers.length === 0 ? (
            <p className="text-center p-10   text-gray-500 col-span-full">
              لا يوجد ابراج لعرضها
            </p>
          ) : (
            towers.map((tw) => (
              <div
                key={tw._id}
                className="bg-white col-span-2 rounded-2xl text-center  p-4 border-r-4"
              >
                <div className="flex justify-between">
                  {user?.role === "admin" &&(

                  <button
                    onClick={() => onDelete(tw._id)}
                    className="cursor-pointer text-red-500 hover:text-red-600"
                  >
                    <Trash />
                  </button>
                  )}
                  <div className="font-bold">
                    {tw.TowerName}
                    <p className="text-gray-500 font-normal text-xs">
                      Added By: {tw.owner?.fullName || "Uknown"}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 ">
                  {tw.vendor} • {tw.ip_address}
                </p>
                <div className="space-y-2">
                  <p>
                    <strong>Status:</strong>{" "}
                    {tw?.status || "N/A"}
                  </p>
                  <p>
                    <strong>RSRP:</strong>{" "}
                    {tw.lastMeasurement?.rsrp?.toFixed(1) || "N/A"} dBm
                  </p>
                  <p>
                    <strong>الحرارة:</strong>{" "}
                    {tw.lastMeasurement?.temperature?.toFixed(1) || "N/A"}°C
                  </p>
                  <p>
                    <strong>آخر تحديث:</strong>{" "}
                    {tw.updatedAt
                      ? new Date(tw.updatedAt).toLocaleTimeString("ar-EG")
                      : "N/A"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
