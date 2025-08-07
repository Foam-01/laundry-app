import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { Badge } from "./components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { 
  Clock, 
  MapPin, 
  User, 
  RefreshCw,
  Settings,
  CheckCircle,
  AlertTriangle,
  Home
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [machines, setMachines] = useState([]);
  const [stats, setStats] = useState({});
  const [bookings, setBookings] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState("all");
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Form states
  const [studentName, setStudentName] = useState("");
  const [studentRoom, setStudentRoom] = useState("");
  const [duration, setDuration] = useState(60);

  const showMessage = (msg, type = "info") => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const fetchData = async () => {
    try {
      const [machinesRes, statsRes, bookingsRes] = await Promise.all([
        axios.get(`${API}/machines`),
        axios.get(`${API}/stats`),
        axios.get(`${API}/bookings/active`)
      ]);
      
      setMachines(machinesRes.data);
      setStats(statsRes.data);
      setBookings(bookingsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      showMessage("เกิดข้อผิดพลาดในการโหลดข้อมูล", "error");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleBookMachine = async () => {
    try {
      await axios.post(`${API}/bookings`, {
        machine_id: selectedMachine.id,
        student_name: studentName,
        student_room: studentRoom,
        duration: parseInt(duration)
      });

      showMessage(`จองเครื่องซักผ้าเลขที่ ${selectedMachine.machine_number} สำเร็จแล้ว`, "success");

      setIsBookingOpen(false);
      setStudentName("");
      setStudentRoom("");
      setDuration(60);
      fetchData();
    } catch (error) {
      showMessage(error.response?.data?.detail || "ไม่สามารถจองเครื่องได้", "error");
    }
  };

  const handleCompleteBooking = async (bookingId) => {
    try {
      await axios.put(`${API}/bookings/${bookingId}/complete`);
      showMessage("การซักผ้าเสร็จสิ้นแล้ว", "success");
      fetchData();
    } catch (error) {
      showMessage("ไม่สามารถอัพเดทสถานะได้", "error");
    }
  };

  const handleUpdateMachineStatus = async (machineId, status) => {
    try {
      await axios.put(`${API}/machines/${machineId}`, { status });
      showMessage("อัพเดทสถานะเครื่องซักผ้าแล้ว", "success");
      fetchData();
    } catch (error) {
      showMessage("ไม่สามารถอัพเดทสถานะได้", "error");
    }
  };

  const filteredMachines = selectedFloor === "all" 
    ? machines 
    : machines.filter(machine => machine.floor === parseInt(selectedFloor));

  const floors = [...new Set(machines.map(machine => machine.floor))].sort();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
          <span className="text-lg text-indigo-800">กำลังโหลด...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-indigo-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-600 p-3 rounded-xl">
                <RefreshCw className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">ระบบจัดการซักผ้า</h1>
                <p className="text-indigo-600 font-medium">หอพักนักศึกษา</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                onClick={fetchData} 
                variant="outline"
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>รีเฟรช</span>
              </Button>
              
              <Dialog open={isAdminOpen} onOpenChange={setIsAdminOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-indigo-600 hover:bg-indigo-700 flex items-center space-x-2">
                    <Settings className="h-4 w-4" />
                    <span>จัดการระบบ</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>จัดการระบบเครื่องซักผ้า</DialogTitle>
                  </DialogHeader>
                  <AdminPanel 
                    machines={machines} 
                    onUpdateStatus={handleUpdateMachineStatus}
                    bookings={bookings}
                    onCompleteBooking={handleCompleteBooking}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Message */}
      {message && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-indigo-100 border-l-4 border-indigo-500 p-4 rounded">
            <p className="text-indigo-800">{message}</p>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard 
            title="เครื่องทั้งหมด" 
            value={stats.total_machines || 0} 
            icon={<RefreshCw className="h-6 w-6" />}
            color="bg-blue-500"
          />
          <StatsCard 
            title="เครื่องว่าง" 
            value={stats.available_machines || 0} 
            icon={<CheckCircle className="h-6 w-6" />}
            color="bg-green-500"
          />
          <StatsCard 
            title="กำลังใช้งาน" 
            value={stats.in_use_machines || 0} 
            icon={<Clock className="h-6 w-6" />}
            color="bg-red-500"
          />
          <StatsCard 
            title="อัตราการใช้งาน" 
            value={`${stats.usage_rate || 0}%`} 
            icon={<RefreshCw className="h-6 w-6" />}
            color="bg-indigo-500"
          />
        </div>

        {/* Floor Filter */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <Label className="text-lg font-semibold text-gray-700">เลือกชั้น:</Label>
            <Select value={selectedFloor} onValueChange={setSelectedFloor}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="เลือกชั้น" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกชั้น</SelectItem>
                {floors.map(floor => (
                  <SelectItem key={floor} value={floor.toString()}>
                    ชั้น {floor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Machines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMachines.map((machine) => (
            <MachineCard 
              key={machine.id}
              machine={machine}
              onBook={(machine) => {
                setSelectedMachine(machine);
                setIsBookingOpen(true);
              }}
            />
          ))}
        </div>

        {/* Booking Dialog */}
        <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>จองเครื่องซักผ้าเลขที่ {selectedMachine?.machine_number}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="studentName">ชื่อนักศึกษา</Label>
                <Input
                  id="studentName"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="กรอกชื่อ-นามสกุล"
                />
              </div>
              <div>
                <Label htmlFor="studentRoom">หมายเลขห้อง</Label>
                <Input
                  id="studentRoom"
                  value={studentRoom}
                  onChange={(e) => setStudentRoom(e.target.value)}
                  placeholder="เช่น A101, B205"
                />
              </div>
              <div>
                <Label htmlFor="duration">ระยะเวลา (นาที)</Label>
                <Select value={duration.toString()} onValueChange={(value) => setDuration(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 นาที</SelectItem>
                    <SelectItem value="45">45 นาที</SelectItem>
                    <SelectItem value="60">60 นาที</SelectItem>
                    <SelectItem value="90">90 นาที</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleBookMachine} 
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={!studentName || !studentRoom}
              >
                ยืนยันการจอง
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

const StatsCard = ({ title, value, icon, color }) => (
  <Card className="hover:shadow-lg transition-shadow duration-300">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`${color} p-3 rounded-full text-white`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

const MachineCard = ({ machine, onBook }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'border-green-400 bg-green-50';
      case 'in_use': return 'border-red-400 bg-red-50';
      case 'out_of_order': return 'border-gray-400 bg-gray-50';
      default: return 'border-gray-300';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available': return 'ว่าง';
      case 'in_use': return 'กำลังใช้งาน';
      case 'out_of_order': return 'เสีย';
      default: return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_use': return <Clock className="h-5 w-5 text-red-500" />;
      case 'out_of_order': return <AlertTriangle className="h-5 w-5 text-gray-500" />;
      default: return null;
    }
  };

  return (
    <Card className={`hover:shadow-xl transition-all duration-300 border-2 ${getStatusColor(machine.status)}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">
            เครื่องที่ {machine.machine_number}
          </CardTitle>
          <Badge 
            variant={machine.status === 'available' ? 'default' : 'secondary'}
            className="flex items-center space-x-1"
          >
            {getStatusIcon(machine.status)}
            <span>{getStatusText(machine.status)}</span>
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2 text-gray-600">
          <Home className="h-4 w-4" />
          <span className="text-sm">ชั้น {machine.floor}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-gray-600">
          <MapPin className="h-4 w-4" />
          <span className="text-sm">{machine.location}</span>
        </div>

        {machine.status === 'in_use' && machine.current_user && (
          <div className="space-y-2 p-3 bg-red-100 rounded-lg">
            <div className="flex items-center space-x-2 text-red-700">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">{machine.current_user}</span>
            </div>
            {machine.time_remaining && (
              <div className="flex items-center space-x-2 text-red-600">
                <Clock className="h-4 w-4" />
                <span className="text-sm">เหลือเวลา {machine.time_remaining} นาที</span>
              </div>
            )}
          </div>
        )}

        {machine.status === 'available' && (
          <Button 
            onClick={() => onBook(machine)}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            จองเครื่องนี้
          </Button>
        )}

        {machine.status === 'out_of_order' && (
          <div className="p-3 bg-gray-100 rounded-lg text-center">
            <span className="text-gray-600 text-sm">เครื่องเสีย - ติดต่อเจ้าหน้าที่</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const AdminPanel = ({ machines, onUpdateStatus, bookings, onCompleteBooking }) => (
  <Tabs defaultValue="machines" className="w-full">
    <TabsList className="grid w-full grid-cols-2">
      <TabsTrigger value="machines">จัดการเครื่องซักผ้า</TabsTrigger>
      <TabsTrigger value="bookings">การจองที่ใช้งานอยู่</TabsTrigger>
    </TabsList>
    
    <TabsContent value="machines" className="mt-4">
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {machines.map((machine) => (
          <div key={machine.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">เครื่องที่ {machine.machine_number}</h4>
              <p className="text-sm text-gray-600">{machine.location} - ชั้น {machine.floor}</p>
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant={machine.status === 'available' ? 'default' : 'outline'}
                onClick={() => onUpdateStatus(machine.id, 'available')}
              >
                ว่าง
              </Button>
              <Button
                size="sm"
                variant={machine.status === 'out_of_order' ? 'destructive' : 'outline'}
                onClick={() => onUpdateStatus(machine.id, 'out_of_order')}
              >
                เสีย
              </Button>
            </div>
          </div>
        ))}
      </div>
    </TabsContent>
    
    <TabsContent value="bookings" className="mt-4">
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {bookings.length === 0 ? (
          <p className="text-gray-500 text-center py-8">ไม่มีการจองที่ใช้งานอยู่</p>
        ) : (
          bookings.map((booking) => {
            const machine = machines.find(m => m.id === booking.machine_id);
            return (
              <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">{booking.student_name}</h4>
                  <p className="text-sm text-gray-600">
                    ห้อง {booking.student_room} - เครื่องที่ {machine?.machine_number}
                  </p>
                  <p className="text-sm text-gray-500">
                    ระยะเวลา: {booking.duration} นาที
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => onCompleteBooking(booking.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  เสร็จสิ้น
                </Button>
              </div>
            );
          })
        )}
      </div>
    </TabsContent>
  </Tabs>
);

export default App;