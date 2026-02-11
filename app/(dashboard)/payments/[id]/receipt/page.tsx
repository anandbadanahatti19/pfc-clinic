"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, ArrowLeft } from "lucide-react";

type PaymentDetail = {
  id: string;
  amount: string;
  method: string;
  status: string;
  receipt: string;
  description: string | null;
  date: string;
  createdAt: string;
  patient: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
  };
  receivedBy: {
    name: string;
  } | null;
  appointment: {
    type: string;
    doctor: string;
  } | null;
};

export default function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/payments/${id}`)
      .then((res) => res.json())
      .then((data) => setPayment(data.payment))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Payment not found</p>
        <Button asChild variant="link" className="mt-2">
          <Link href="/payments">Back to Payments</Link>
        </Button>
      </div>
    );
  }

  const amount = Number(payment.amount);
  const dateStr = new Date(payment.date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      {/* Print-only styles */}
      <style jsx global>{`
        @media print {
          /* Hide dashboard shell */
          nav,
          aside,
          header,
          [data-sidebar],
          [data-topbar] {
            display: none !important;
          }
          /* Hide action buttons */
          .no-print {
            display: none !important;
          }
          /* Reset main area */
          main {
            padding: 0 !important;
            overflow: visible !important;
          }
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .receipt-container {
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
            margin: 0 !important;
          }
        }
      `}</style>

      {/* Action bar - hidden when printing */}
      <div className="no-print flex items-center gap-2 mb-6">
        <Button asChild variant="ghost" size="icon">
          <Link href="/payments">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold flex-1">Receipt</h1>
        <Button onClick={() => window.print()}>
          <Printer className="mr-1 h-4 w-4" /> Print Receipt
        </Button>
      </div>

      {/* Receipt */}
      <div className="receipt-container max-w-2xl mx-auto bg-white text-black border rounded-lg shadow-sm p-8">
        {/* Header */}
        <div className="text-center border-b pb-4 mb-6">
          <h2 className="text-xl font-bold tracking-wide">
            PRASHANTI FERTILITY CENTRE
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Specialised in IVF, IUI, ICSI &amp; Fertility Treatments
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Contact: +91-XXXXXXXXXX
          </p>
        </div>

        {/* Receipt title */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold border border-black inline-block px-6 py-1">
            PAYMENT RECEIPT
          </h3>
        </div>

        {/* Receipt meta */}
        <div className="flex justify-between text-sm mb-6">
          <div>
            <span className="text-gray-600">Receipt No: </span>
            <span className="font-mono font-semibold">{payment.receipt}</span>
          </div>
          <div>
            <span className="text-gray-600">Date: </span>
            <span className="font-semibold">{dateStr}</span>
          </div>
        </div>

        {/* Patient info */}
        <div className="border rounded p-4 mb-6 bg-gray-50">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Patient Details
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Name: </span>
              <span className="font-medium">{payment.patient.name}</span>
            </div>
            <div>
              <span className="text-gray-600">Phone: </span>
              <span className="font-medium">{payment.patient.phone}</span>
            </div>
            {payment.patient.email && (
              <div className="col-span-2">
                <span className="text-gray-600">Email: </span>
                <span className="font-medium">{payment.patient.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment details table */}
        <table className="w-full text-sm mb-6 border-collapse">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="text-left py-2 font-semibold">Description</th>
              <th className="text-right py-2 font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-3">
                {payment.description || "Consultation / Treatment Fee"}
                {payment.appointment && (
                  <span className="block text-xs text-gray-500 mt-0.5">
                    {payment.appointment.type} — {payment.appointment.doctor}
                  </span>
                )}
              </td>
              <td className="py-3 text-right font-mono">
                ₹{amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-black">
              <td className="py-3 font-bold text-base">Total</td>
              <td className="py-3 text-right font-bold text-base font-mono">
                ₹{amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Payment info */}
        <div className="flex justify-between text-sm mb-8">
          <div>
            <span className="text-gray-600">Payment Method: </span>
            <span className="font-medium">{payment.method}</span>
          </div>
          <div>
            <span className="text-gray-600">Status: </span>
            <span className="font-medium">{payment.status}</span>
          </div>
        </div>

        {/* Signature area */}
        <div className="flex justify-between items-end mt-12 pt-4">
          <div className="text-center">
            <div className="border-t border-black w-48 pt-1">
              <p className="text-xs text-gray-500">Patient Signature</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium mb-1">
              {payment.receivedBy?.name || "—"}
            </p>
            <div className="border-t border-black w-48 pt-1">
              <p className="text-xs text-gray-500">Authorised Signatory</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 mt-8 pt-4 border-t">
          <p>This is a computer-generated receipt.</p>
          <p>Thank you for choosing Prashanti Fertility Centre.</p>
        </div>
      </div>
    </>
  );
}
