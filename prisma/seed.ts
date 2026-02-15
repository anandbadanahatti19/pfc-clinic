import { PrismaClient, Role, AppointmentStatus, PaymentMethod, PaymentStatus, FollowUpStatus } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Clean existing data (order matters for FK constraints)
  await prisma.inventoryTransaction.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();
  await prisma.clinic.deleteMany();

  // ─── Create Clinic (Tenant) ───

  const clinic = await prisma.clinic.create({
    data: {
      name: "Prashanti Fertility Centre",
      slug: "prashanti",
      abbreviation: "PFC",
      tagline: "Specialised in IVF, IUI, ICSI & Fertility Treatments",
      phone: "+91 8105713475",
      email: "prashantifertilitycentre@gmail.com",
      address: "97 Champaka, 1st Floor, Doddakallasandra Village, Kanakapura Rd",
      city: "Bengaluru",
      timeSlots: [
        "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00",
        "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
      ],
      doctors: [
        "Dr. Chandrika P. Kulkarni",
        "Dr. Prashanth M Kulkarni",
      ],
      enabledFeatures: {
        patients: true,
        appointments: true,
        payments: true,
        followups: true,
        inventory: true,
        reports: true,
      },
      plan: "professional",
    },
  });

  console.log(`  Clinic created: ${clinic.name} (slug: ${clinic.slug})`);

  // ─── Create Super Admin (no clinic) ───

  const superAdminHash = await bcrypt.hash("superadmin123", 10);
  await prisma.user.create({
    data: {
      name: "Platform Admin",
      email: "admin@platform.com",
      password: superAdminHash,
      role: Role.SUPER_ADMIN,
      clinicId: null,
    },
  });

  console.log("  Super Admin created: admin@platform.com");

  // ─── Create Clinic Users ───

  const adminHash = await bcrypt.hash("admin123", 10);
  const receptionHash = await bcrypt.hash("reception123", 10);
  const nurseHash = await bcrypt.hash("nurse123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Dr. Chandrika P. Kulkarni",
      email: "admin@pfc.com",
      password: adminHash,
      role: Role.ADMIN,
      clinicId: clinic.id,
    },
  });

  const receptionist = await prisma.user.create({
    data: {
      name: "Rekha S",
      email: "receptionist@pfc.com",
      password: receptionHash,
      role: Role.RECEPTIONIST,
      clinicId: clinic.id,
    },
  });

  await prisma.user.create({
    data: {
      name: "Sunita M",
      email: "nurse@pfc.com",
      password: nurseHash,
      role: Role.NURSE,
      clinicId: clinic.id,
    },
  });

  console.log("  Clinic users created");

  // ─── Create Patients ───

  const patients = await Promise.all([
    prisma.patient.create({
      data: {
        name: "Ananya Sharma",
        phone: "9876543210",
        email: "ananya@email.com",
        age: 29,
        gender: "Female",
        medicalNotes: "PCOS diagnosed 2024. On metformin. Regular cycles after treatment.",
        registeredById: receptionist.id,
        clinicId: clinic.id,
      },
    }),
    prisma.patient.create({
      data: {
        name: "Priya Reddy",
        phone: "9876543211",
        email: "priya.r@email.com",
        age: 33,
        gender: "Female",
        medicalNotes: "IVF cycle 2 planned. AMH 1.8. Previous failed IUI x3.",
        registeredById: receptionist.id,
        clinicId: clinic.id,
      },
    }),
    prisma.patient.create({
      data: {
        name: "Meena Kulkarni",
        phone: "9876543212",
        email: "meena.k@email.com",
        age: 31,
        gender: "Female",
        medicalNotes: "Unexplained infertility. HSG normal. Partner SA normal.",
        registeredById: receptionist.id,
        clinicId: clinic.id,
      },
    }),
    prisma.patient.create({
      data: {
        name: "Kavitha Nair",
        phone: "9876543213",
        email: "kavitha@email.com",
        age: 36,
        gender: "Female",
        medicalNotes: "Endometriosis stage 3. Laparoscopy done Jan 2026.",
        registeredById: admin.id,
        clinicId: clinic.id,
      },
    }),
    prisma.patient.create({
      data: {
        name: "Deepa Iyer",
        phone: "9876543214",
        email: "deepa.i@email.com",
        age: 28,
        gender: "Female",
        medicalNotes: "First consultation. Trying for 18 months. No prior treatment.",
        registeredById: receptionist.id,
        clinicId: clinic.id,
      },
    }),
    prisma.patient.create({
      data: {
        name: "Rashmi Patil",
        phone: "9876543215",
        email: "rashmi.p@email.com",
        age: 34,
        gender: "Female",
        medicalNotes: "Recurrent miscarriage x2. Thrombophilia workup pending.",
        registeredById: admin.id,
        clinicId: clinic.id,
      },
    }),
  ]);

  console.log("  Patients created");

  // ─── Create Appointments ───

  const today = new Date("2026-02-07");
  const tomorrow = new Date("2026-02-08");

  const appointments = await Promise.all([
    prisma.appointment.create({
      data: {
        patientId: patients[0].id,
        date: today,
        time: "10:00",
        type: "Consultation",
        doctor: "Dr. Chandrika P. Kulkarni",
        status: AppointmentStatus.COMPLETED,
        notes: "Follow-up on PCOS management. Continue metformin.",
        createdById: receptionist.id,
        clinicId: clinic.id,
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[1].id,
        date: today,
        time: "10:30",
        type: "IVF",
        doctor: "Dr. Chandrika P. Kulkarni",
        status: AppointmentStatus.COMPLETED,
        notes: "Egg retrieval scheduled for Feb 12.",
        createdById: receptionist.id,
        clinicId: clinic.id,
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[2].id,
        date: today,
        time: "11:00",
        type: "Ultrasound",
        doctor: "Dr. Prashanth M Kulkarni",
        status: AppointmentStatus.SCHEDULED,
        notes: "Follicular monitoring Day 10.",
        createdById: receptionist.id,
        clinicId: clinic.id,
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[4].id,
        date: today,
        time: "11:30",
        type: "Consultation",
        doctor: "Dr. Chandrika P. Kulkarni",
        status: AppointmentStatus.SCHEDULED,
        notes: "Initial fertility workup discussion.",
        createdById: receptionist.id,
        clinicId: clinic.id,
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[3].id,
        date: today,
        time: "16:00",
        type: "Follow-up",
        doctor: "Dr. Chandrika P. Kulkarni",
        status: AppointmentStatus.SCHEDULED,
        notes: "Post-laparoscopy check.",
        createdById: admin.id,
        clinicId: clinic.id,
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[5].id,
        date: today,
        time: "16:30",
        type: "Lab Test",
        doctor: "Dr. Prashanth M Kulkarni",
        status: AppointmentStatus.CANCELLED,
        notes: "Patient requested reschedule to next week.",
        createdById: receptionist.id,
        clinicId: clinic.id,
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[0].id,
        date: tomorrow,
        time: "10:00",
        type: "Ultrasound",
        doctor: "Dr. Chandrika P. Kulkarni",
        status: AppointmentStatus.SCHEDULED,
        notes: "Follicular scan.",
        createdById: receptionist.id,
        clinicId: clinic.id,
      },
    }),
  ]);

  console.log("  Appointments created");

  // ─── Create Payments ───

  await Promise.all([
    prisma.payment.create({
      data: {
        patientId: patients[0].id,
        appointmentId: appointments[0].id,
        amount: 1500,
        method: PaymentMethod.CASH,
        status: PaymentStatus.PAID,
        receipt: "PFC-20260207-001",
        date: new Date("2026-02-07T10:30:00"),
        description: "Consultation fee",
        receivedById: receptionist.id,
        clinicId: clinic.id,
      },
    }),
    prisma.payment.create({
      data: {
        patientId: patients[1].id,
        appointmentId: appointments[1].id,
        amount: 25000,
        method: PaymentMethod.ONLINE,
        status: PaymentStatus.PAID,
        receipt: "PFC-20260207-002",
        date: new Date("2026-02-07T11:00:00"),
        description: "IVF cycle 2 - initial payment",
        receivedById: receptionist.id,
        clinicId: clinic.id,
      },
    }),
    prisma.payment.create({
      data: {
        patientId: patients[3].id,
        amount: 3500,
        method: PaymentMethod.ONLINE,
        status: PaymentStatus.PAID,
        receipt: "PFC-20260206-001",
        date: new Date("2026-02-06T14:00:00"),
        description: "Lab tests package",
        receivedById: receptionist.id,
        clinicId: clinic.id,
      },
    }),
    prisma.payment.create({
      data: {
        patientId: patients[2].id,
        amount: 2000,
        method: PaymentMethod.CASH,
        status: PaymentStatus.PAID,
        receipt: "PFC-20260206-002",
        date: new Date("2026-02-06T12:00:00"),
        description: "Ultrasound + consultation",
        receivedById: receptionist.id,
        clinicId: clinic.id,
      },
    }),
    prisma.payment.create({
      data: {
        patientId: patients[4].id,
        amount: 1500,
        method: PaymentMethod.CASH,
        status: PaymentStatus.PENDING,
        receipt: "PFC-20260205-001",
        date: new Date("2026-02-05T11:00:00"),
        description: "Initial consultation",
        receivedById: receptionist.id,
        clinicId: clinic.id,
      },
    }),
  ]);

  console.log("  Payments created");

  // ─── Create Follow-ups ───

  await Promise.all([
    prisma.followUp.create({
      data: {
        patientId: patients[0].id,
        appointmentId: appointments[0].id,
        scheduledDate: new Date("2026-02-14"),
        reason: "PCOS follow-up - check hormone levels",
        status: FollowUpStatus.PENDING,
        notes: "Bring latest blood work results.",
        createdById: admin.id,
        clinicId: clinic.id,
      },
    }),
    prisma.followUp.create({
      data: {
        patientId: patients[1].id,
        appointmentId: appointments[1].id,
        scheduledDate: new Date("2026-02-12"),
        reason: "Egg retrieval procedure",
        status: FollowUpStatus.SCHEDULED,
        notes: "Fasting required. Report by 7 AM.",
        createdById: admin.id,
        clinicId: clinic.id,
      },
    }),
    prisma.followUp.create({
      data: {
        patientId: patients[3].id,
        appointmentId: appointments[4].id,
        scheduledDate: new Date("2026-02-10"),
        reason: "Post-laparoscopy 1-month review",
        status: FollowUpStatus.PENDING,
        notes: "Check healing, discuss next steps for fertility treatment.",
        createdById: admin.id,
        clinicId: clinic.id,
      },
    }),
    prisma.followUp.create({
      data: {
        patientId: patients[2].id,
        appointmentId: appointments[2].id,
        scheduledDate: new Date("2026-02-09"),
        reason: "Day 12 follicular monitoring",
        status: FollowUpStatus.SCHEDULED,
        notes: "Ultrasound + trigger decision.",
        createdById: admin.id,
        clinicId: clinic.id,
      },
    }),
    prisma.followUp.create({
      data: {
        patientId: patients[5].id,
        scheduledDate: new Date("2026-02-20"),
        reason: "Thrombophilia panel results discussion",
        status: FollowUpStatus.PENDING,
        notes: "Review lab reports and plan treatment.",
        createdById: admin.id,
        clinicId: clinic.id,
      },
    }),
  ]);

  console.log("  Follow-ups created");
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
