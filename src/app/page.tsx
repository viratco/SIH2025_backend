import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
              Telemedicine
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8">
              Secure Video Consultations Between Doctors and Patients
            </p>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Connect with healthcare professionals or patients through our secure, 
              peer-to-peer video consultation platform. High-quality video calls 
              with real-time communication.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Link href="/doctor">
              <div className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-6 transition-all duration-200 transform hover:scale-105 cursor-pointer">
                <div className="text-3xl mb-4">👩‍⚕️</div>
                <h2 className="text-xl font-semibold mb-2">I'm a Doctor</h2>
                <p className="text-blue-100">
                  Create consultation rooms and manage patient appointments
                </p>
              </div>
            </Link>

            <Link href="/patient">
              <div className="bg-green-600 hover:bg-green-700 text-white rounded-xl p-6 transition-all duration-200 transform hover:scale-105 cursor-pointer">
                <div className="text-3xl mb-4">🧑‍💼</div>
                <h2 className="text-xl font-semibold mb-2">I'm a Patient</h2>
                <p className="text-green-100">
                  Join consultation rooms using your room ID
                </p>
              </div>
            </Link>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-600">
              <div className="flex items-center justify-center">
                <span className="text-green-500 mr-2">🔒</span>
                Secure & Private
              </div>
              <div className="flex items-center justify-center">
                <span className="text-blue-500 mr-2">📹</span>
                HD Video Quality
              </div>
              <div className="flex items-center justify-center">
                <span className="text-purple-500 mr-2">⚡</span>
                Real-time Communication
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
