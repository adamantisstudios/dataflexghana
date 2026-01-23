"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, Upload, Info } from "lucide-react";
import { validateBulkOrderRow } from "@/hooks/useFileParser";
import { PricingChecker } from "./PricingChecker";
import { Badge } from "@/components/ui/badge";
import * as XLSX from "xlsx";

interface BulkOrderRow {
  phone: string;
  capacity: string;
  network: string;
  rawPhone: string;
  error?: string;
  valid: boolean;
}

const PAYMENT_INSTRUCTION = "Your bulk order has been submitted. Please pay manually to 0557943392 (Adamantis Solutions) for processing.";
const MAX_ROWS = 2000;
const PAYMENT_NUMBER = "0557943392";

export default function BulkOrdersUploader() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadMode, setUploadMode] = useState<"csv" | "text">("csv");
  const [textInput, setTextInput] = useState("");
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<BulkOrderRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submissionId, setSubmissionId] = useState("");
  const [paymentPin, setPaymentPin] = useState("");
  const [agentId, setAgentId] = useState<string | null>(null);

  useEffect(() => {
    const agentData = localStorage.getItem("agent");
    if (agentData) {
      try {
        const parsed = JSON.parse(agentData);
        setAgentId(parsed.id);
      } catch (error) {
        console.error("Failed to parse agent data:", error);
      }
    }
  }, []);

  const parseXLSXFile = async (file: File): Promise<BulkOrderRow[]> => {
    try {
      let data: any[] = [];
      if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[];
      } else {
        const text = await file.text();
        data = text
          .split(/[\r\n]+/)
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .map((line) => line.split(/[,\t;|]+/).map((p) => p.trim()));
      }

      const startIndex = data[0]?.some(
        (cell: any) => typeof cell === "string" && cell.toLowerCase().match(/phone|number|network|gigab|capacity|gb/),
      )
        ? 1
        : 0;

      return data.slice(startIndex).map((row: any[]) => {
        if (!row || row.length < 2) {
          return {
            phone: "",
            capacity: "",
            network: "",
            rawPhone: "",
            error: "Insufficient data",
            valid: false,
          };
        }

        const phone = String(row[0] || "").trim();
        const secondField = String(row[1] || "").trim();
        const thirdField = String(row[2] || "").trim();
        let network = "";
        let capacity = "";

        if (["MTN", "AirtelTigo", "Telecel"].includes(secondField)) {
          network = secondField;
          capacity = thirdField;
        } else if (["MTN", "AirtelTigo", "Telecel"].includes(thirdField)) {
          capacity = secondField;
          network = thirdField;
        } else {
          capacity = secondField;
          network = "";
        }

        const validation = validateBulkOrderRow(phone, capacity, network);
        return {
          phone: validation.phone || "",
          capacity: validation.capacity?.toString() || "",
          network: validation.network || "",
          rawPhone: phone,
          error: validation.error,
          valid: validation.valid,
        };
      });
    } catch (error) {
      console.error("Error parsing file:", error);
      return [];
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    let parsed: BulkOrderRow[] = [];

    if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.name.endsWith(".csv")) {
      parsed = await parseXLSXFile(file);
    } else {
      alert("Please upload a CSV or Excel file (.csv, .xlsx, .xls)");
      return;
    }

    if (parsed.length > MAX_ROWS) {
      alert(`File contains too many rows. Maximum is ${MAX_ROWS}.`);
      return;
    }

    setRows(parsed);
    setTextInput("");
  };

  const handleTextParse = () => {
    const lines = textInput
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length > MAX_ROWS) {
      alert(`Text contains too many rows. Maximum is ${MAX_ROWS}.`);
      return;
    }

    const parsed = lines.map((raw) => {
      const parts = raw.split(/[\s,\t]+/).filter(Boolean);
      const phone = parts[0] || "";
      const secondField = parts[1] || "";
      const thirdField = parts[2] || "";
      let network = "";
      let capacity = "";

      if (["MTN", "AirtelTigo", "Telecel"].includes(secondField)) {
        network = secondField;
        capacity = thirdField;
      } else if (["MTN", "AirtelTigo", "Telecel"].includes(thirdField)) {
        capacity = secondField;
        network = thirdField;
      } else {
        capacity = secondField;
        network = "";
      }

      const validation = validateBulkOrderRow(phone, capacity, network);
      return {
        phone: validation.phone || "",
        capacity: validation.capacity?.toString() || "",
        network: validation.network || "",
        rawPhone: phone,
        error: validation.error,
        valid: validation.valid,
      };
    });

    setRows(parsed);
    setFileName("");
  };

  const validRows = rows.filter((r) => r.valid);
  const invalidRows = rows.filter((r) => !r.valid);

  const handleSubmit = async () => {
    if (validRows.length === 0) {
      alert("No valid rows to submit");
      return;
    }

    if (!agentId) {
      alert("Agent ID not found. Please log in again.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/agent/bulk-orders/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: agentId,
          source: uploadMode,
          rows: validRows.map((r) => ({
            phone: r.phone,
            capacity_gb: Number.parseFloat(r.capacity),
            network: r.network,
            raw_phone: r.rawPhone,
          })),
          payment_instructions: PAYMENT_INSTRUCTION,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Response error:", data);
        throw new Error(data.message || "Failed to submit bulk orders");
      }

      setSubmissionId(data.submission_id);
      setPaymentPin(data.payment_pin);
      setShowConfirm(false);
      setShowSuccess(true);
      setRows([]);
      setTextInput("");
    } catch (error: any) {
      console.error("Submit error:", error);
      alert(error.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-emerald-200 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-emerald-500 to-green-500 text-white">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6" />
              <div>
                <CardTitle>Bulk Orders Submitted</CardTitle>
                <CardDescription className="text-emerald-100">Orders received successfully</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Submission ID:</p>
              <div className="flex gap-2 items-center">
                <code className="flex-1 bg-gray-100 p-3 rounded border text-center font-mono text-sm text-emerald-700">
                  {submissionId}
                </code>
              </div>
            </div>
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-yellow-900">Payment PIN:</p>
              <div className="flex gap-2 items-center bg-white p-3 rounded border border-yellow-400">
                <code className="flex-1 font-mono font-bold text-2xl text-yellow-900 text-center">{paymentPin}</code>
              </div>
              <p className="text-xs text-yellow-800">Use this PIN when making payment to verify your submission</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-semibold mb-3">Payment Instructions:</p>
              <p className="text-sm text-blue-800 mb-3">{PAYMENT_INSTRUCTION}</p>
              <div className="flex gap-2 items-center bg-white p-3 rounded border border-blue-300">
                <code className="flex-1 font-mono font-bold text-lg text-blue-900">{PAYMENT_NUMBER}</code>
              </div>
            </div>
            <Button onClick={() => router.push("/agent/dashboard")} className="w-full bg-emerald-600 hover:bg-emerald-700">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PricingChecker />
      <Card className="border-emerald-100 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
          <CardTitle className="text-emerald-800 flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Orders
          </CardTitle>
          <CardDescription className="text-emerald-600">
            Upload or paste phone numbers with network type and data capacities
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Alert className="mb-6 border-emerald-200 bg-emerald-50">
            <Info className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-700 text-sm">
              <strong>Supported Format:</strong> Phone number, Network type (optional), Gigabyte Capacity
              <br />
              <strong>Network Auto-Detection:</strong> If you don't provide a network type, the system will automatically detect it based on the phone number prefix. Prefixes: MTN (024, 025, 053, 054, 055, 059), AirtelTigo (026, 027, 056, 057), Telecel (020, 050).
            </AlertDescription>
          </Alert>
          <Tabs value={uploadMode} onValueChange={(v) => setUploadMode(v as "csv" | "text")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="csv">CSV/Excel Upload</TabsTrigger>
              <TabsTrigger value="text">Text Input</TabsTrigger>
            </TabsList>
            <TabsContent value="csv" className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-300 rounded-lg p-8 text-center cursor-pointer hover:bg-emerald-50 transition"
              >
                <Upload className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                <p className="font-semibold text-gray-900">Click to upload CSV or Excel file</p>
                <p className="text-sm text-gray-500 mt-1">
                  Supported formats: .csv, .xlsx, .xls
                  <br />
                  Format: Phone Number, Network Type (optional), Gigabyte Capacity
                </p>
                {fileName && <p className="text-sm text-emerald-600 font-semibold mt-2">File: {fileName}</p>}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
            </TabsContent>
            <TabsContent value="text" className="space-y-4">
              <div>
                <Textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Enter phone, network (optional), and capacity on each line:
0241234567 MTN 5
0242345678 AirtelTigo 10
0243456789 15
0244567890 Telecel 1"
                  rows={8}
                  className="border-emerald-200 focus:border-emerald-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Format: phone [network] capacity (space or tab separated). Network can be MTN, AirtelTigo, or Telecel (optional - auto-detected if not provided)
                </p>
              </div>
              <Button
                onClick={handleTextParse}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={!textInput.trim()}
              >
                Parse Text
              </Button>
            </TabsContent>
          </Tabs>
          {rows.length > 0 && (
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-semibold text-gray-900">Preview ({rows.length} rows)</h3>
                <div className="flex gap-2 text-sm flex-wrap">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded">Valid: {validRows.length}</span>
                  {invalidRows.length > 0 && (
                    <span className="bg-red-100 text-red-800 px-3 py-1 rounded">Invalid: {invalidRows.length}</span>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 rounded-lg">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-3 py-2 text-left">Phone</th>
                      <th className="px-3 py-2 text-left">Network</th>
                      <th className="px-3 py-2 text-left">Capacity (GB)</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 10).map((row, i) => (
                      <tr key={i} className={row.valid ? "bg-green-50" : "bg-red-50"}>
                        <td className="px-3 py-2 font-mono">{row.phone || row.rawPhone}</td>
                        <td className="px-3 py-2">
                          <Badge variant="secondary" className="text-xs">
                            {row.network || "Auto-detect"}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">{row.capacity}</td>
                        <td className="px-3 py-2">
                          {row.valid ? (
                            <span className="text-green-700 font-semibold">✓ Valid</span>
                          ) : (
                            <span className="text-red-700 text-xs font-semibold">{row.error}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 10 && (
                <p className="text-sm text-gray-500 text-center">Showing first 10 rows of {rows.length}...</p>
              )}
              <Alert className="border-blue-200 bg-blue-50">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-sm">
                  After submission, you'll need to pay manually to {PAYMENT_NUMBER} for processing.
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => setShowConfirm(true)}
                disabled={validRows.length === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 py-3 font-semibold"
              >
                Submit {validRows.length} Valid Orders
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="w-[95vw] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-emerald-800">Confirm Bulk Order Submission</AlertDialogTitle>
            <AlertDialogDescription>
              You're about to submit {validRows.length} orders. {invalidRows.length > 0 && `${invalidRows.length} rows will be skipped.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 bg-emerald-50 rounded-lg p-4 border border-emerald-200">
            <div className="flex justify-between text-sm">
              <span className="text-emerald-700">Valid Orders:</span>
              <span className="font-semibold text-emerald-900">{validRows.length}</span>
            </div>
            {invalidRows.length > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-red-700">Invalid Rows:</span>
                <span className="font-semibold text-red-900">{invalidRows.length}</span>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? "Submitting..." : "Confirm & Submit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
