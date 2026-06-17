// Public landing — hero โชว์ว่า token/ธีม/dark ทำงาน (ใช้ utility ที่ map กับ token ล้วน)
import { ArrowRight, BarChart3, Boxes, Users } from "lucide-react";

import { Container } from "@/src/presentation/components/ui/Container";
import { Button } from "@/src/presentation/components/ui/Button";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";

const FEATURES = [
  { icon: Boxes, title: "จัดการสต๊อก", desc: "ติดตามสินค้าคงคลังแบบเรียลไทม์ทุกสาขา" },
  { icon: BarChart3, title: "รายงานยอดขาย", desc: "สรุปยอดและวิเคราะห์แนวโน้มอัตโนมัติ" },
  { icon: Users, title: "จัดการทีมงาน", desc: "กำหนดสิทธิ์และบทบาทของพนักงานแต่ละคน" },
];

export default function HomePage() {
  return (
    <Container className="py-20 sm:py-28">
      <section className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
          ระบบ ERP ครบวงจร
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
          บริหารธุรกิจของคุณ <span className="text-brand-500">ในที่เดียว</span>
        </h1>
        <p className="mt-4 text-lg text-muted">
          ตั้งแต่สต๊อก การขาย ไปจนถึงการเงินและทีมงาน — รวมทุกอย่างไว้บนแพลตฟอร์มเดียวที่ใช้ง่าย
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button>
            เริ่มใช้งานฟรี
            <ArrowRight className="size-4" />
          </Button>
          <Button variant="secondary">ดูตัวอย่าง</Button>
        </div>
      </section>

      <section id="features" className="mt-20 grid gap-6 sm:grid-cols-3">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <Card key={f.title}>
              <CardBody>
                <div className="inline-flex rounded-xl bg-brand-50 p-3 text-brand-600">
                  <Icon className="size-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted">{f.desc}</p>
              </CardBody>
            </Card>
          );
        })}
      </section>
    </Container>
  );
}
