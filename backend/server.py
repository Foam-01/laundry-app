from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class MachineStatus(str, Enum):
    AVAILABLE = "available"
    IN_USE = "in_use"
    OUT_OF_ORDER = "out_of_order"

class BookingStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

# Models
class Machine(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    machine_number: int
    status: MachineStatus
    current_user: Optional[str] = None
    time_remaining: Optional[int] = None  # in minutes
    floor: int
    location: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class MachineCreate(BaseModel):
    machine_number: int
    status: MachineStatus = MachineStatus.AVAILABLE
    floor: int
    location: str

class MachineUpdate(BaseModel):
    status: Optional[MachineStatus] = None
    current_user: Optional[str] = None
    time_remaining: Optional[int] = None

class Booking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    machine_id: str
    student_name: str
    student_room: str
    start_time: datetime
    duration: int  # in minutes
    status: BookingStatus
    created_at: datetime = Field(default_factory=datetime.utcnow)

class BookingCreate(BaseModel):
    machine_id: str
    student_name: str
    student_room: str
    duration: int = 60  # default 60 minutes

# Initialize sample data
@app.on_event("startup")
async def startup_db():
    # Check if machines already exist
    existing_machines = await db.machines.count_documents({})
    if existing_machines == 0:
        # Create sample machines
        sample_machines = [
            {"machine_number": 1, "status": "available", "floor": 1, "location": "Laundry Room A"},
            {"machine_number": 2, "status": "in_use", "floor": 1, "location": "Laundry Room A", "current_user": "นักศึกษา A", "time_remaining": 25},
            {"machine_number": 3, "status": "available", "floor": 1, "location": "Laundry Room A"},
            {"machine_number": 4, "status": "out_of_order", "floor": 1, "location": "Laundry Room A"},
            {"machine_number": 5, "status": "in_use", "floor": 2, "location": "Laundry Room B", "current_user": "นักศึกษา B", "time_remaining": 45},
            {"machine_number": 6, "status": "available", "floor": 2, "location": "Laundry Room B"},
        ]
        
        for machine_data in sample_machines:
            machine = Machine(**machine_data)
            await db.machines.insert_one(machine.dict())

# Machine endpoints
@api_router.get("/machines", response_model=List[Machine])
async def get_machines():
    machines = await db.machines.find().to_list(1000)
    return [Machine(**machine) for machine in machines]

@api_router.get("/machines/floor/{floor}", response_model=List[Machine])
async def get_machines_by_floor(floor: int):
    machines = await db.machines.find({"floor": floor}).to_list(1000)
    return [Machine(**machine) for machine in machines]

@api_router.get("/machines/{machine_id}", response_model=Machine)
async def get_machine(machine_id: str):
    machine = await db.machines.find_one({"id": machine_id})
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    return Machine(**machine)

@api_router.post("/machines", response_model=Machine)
async def create_machine(machine_data: MachineCreate):
    machine = Machine(**machine_data.dict())
    await db.machines.insert_one(machine.dict())
    return machine

@api_router.put("/machines/{machine_id}", response_model=Machine)
async def update_machine(machine_id: str, update_data: MachineUpdate):
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()
    
    result = await db.machines.update_one(
        {"id": machine_id}, 
        {"$set": update_dict}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Machine not found")
    
    updated_machine = await db.machines.find_one({"id": machine_id})
    return Machine(**updated_machine)

# Booking endpoints
@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking_data: BookingCreate):
    # Check if machine is available
    machine = await db.machines.find_one({"id": booking_data.machine_id})
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    
    if machine["status"] != "available":
        raise HTTPException(status_code=400, detail="Machine is not available")
    
    # Create booking
    booking = Booking(
        **booking_data.dict(),
        start_time=datetime.utcnow(),
        status=BookingStatus.ACTIVE
    )
    
    await db.bookings.insert_one(booking.dict())
    
    # Update machine status
    await db.machines.update_one(
        {"id": booking_data.machine_id},
        {"$set": {
            "status": "in_use",
            "current_user": booking_data.student_name,
            "time_remaining": booking_data.duration,
            "updated_at": datetime.utcnow()
        }}
    )
    
    return booking

@api_router.get("/bookings", response_model=List[Booking])
async def get_bookings():
    bookings = await db.bookings.find().to_list(1000)
    return [Booking(**booking) for booking in bookings]

@api_router.get("/bookings/active", response_model=List[Booking])
async def get_active_bookings():
    bookings = await db.bookings.find({"status": "active"}).to_list(1000)
    return [Booking(**booking) for booking in bookings]

@api_router.put("/bookings/{booking_id}/complete")
async def complete_booking(booking_id: str):
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Update booking status
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"status": "completed"}}
    )
    
    # Update machine status to available
    await db.machines.update_one(
        {"id": booking["machine_id"]},
        {"$set": {
            "status": "available",
            "current_user": None,
            "time_remaining": None,
            "updated_at": datetime.utcnow()
        }}
    )
    
    return {"message": "Booking completed successfully"}

# Statistics endpoint
@api_router.get("/stats")
async def get_stats():
    total_machines = await db.machines.count_documents({})
    available_machines = await db.machines.count_documents({"status": "available"})
    in_use_machines = await db.machines.count_documents({"status": "in_use"})
    out_of_order_machines = await db.machines.count_documents({"status": "out_of_order"})
    
    return {
        "total_machines": total_machines,
        "available_machines": available_machines,
        "in_use_machines": in_use_machines,
        "out_of_order_machines": out_of_order_machines,
        "usage_rate": round((in_use_machines / total_machines) * 100, 1) if total_machines > 0 else 0
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()