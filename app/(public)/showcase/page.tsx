// Showcase — รีวิว component กลางทุกตัว ในทุกธีม/ทุก state (สลับธีม/dark ได้จาก header)
"use client";

import { useState, type ReactNode } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  Inbox,
  Users,
  DollarSign,
  Package,
  MoreHorizontal,
} from "lucide-react";

import {
  Container,
  Card,
  CardBody,
  Button,
  Input,
  Textarea,
  Select,
  Checkbox,
  Radio,
  Switch,
  FormField,
  Badge,
  Alert,
  Spinner,
  Skeleton,
  EmptyState,
  useToast,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Drawer,
  DropdownMenu,
  DropdownItem,
  Tooltip,
  Table,
  THead,
  TBody,
  Tr,
  Th,
  Td,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  Pagination,
  Breadcrumb,
  Avatar,
  StatCard,
} from "@/src/presentation/components/ui";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      <Card>
        <CardBody className="flex flex-wrap items-start gap-4">{children}</CardBody>
      </Card>
    </section>
  );
}

export default function ShowcasePage() {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(3);

  return (
    <Container className="space-y-12 py-12">
      <header className="space-y-2">
        <Breadcrumb
          items={[
            { label: "หน้าแรก", href: "/" },
            { label: "Showcase" },
          ]}
        />
        <h1 className="text-3xl font-bold">UI Component Showcase</h1>
        <p className="text-muted">
          รีวิว component กลางทุกตัว — สลับธีม cafe/minimal/retro + dark จาก switcher บน header
        </p>
      </header>

      {/* ---- Buttons ---- */}
      <Section title="Buttons">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button size="sm">Small</Button>
        <Button disabled>Disabled</Button>
        <Button>
          <Plus className="size-4" />
          มีไอคอน
        </Button>
      </Section>

      {/* ---- Form controls ---- */}
      <Section title="Form controls">
        <div className="grid w-full gap-5 sm:grid-cols-2">
          <FormField label="ชื่อร้าน" required hint="ชื่อที่จะแสดงต่อลูกค้า">
            <Input placeholder="เช่น ร้านกาแฟดีดี" />
          </FormField>
          <FormField label="อีเมล" error="อีเมลไม่ถูกต้อง">
            <Input defaultValue="not-an-email" />
          </FormField>
          <FormField label="ประเภทธุรกิจ">
            <Select>
              <option>ร้านอาหาร</option>
              <option>ค้าปลีก</option>
              <option>บริการ</option>
            </Select>
          </FormField>
          <FormField label="รายละเอียด">
            <Textarea placeholder="อธิบายธุรกิจของคุณ..." />
          </FormField>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox defaultChecked /> ยอมรับเงื่อนไข
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Radio name="demo" defaultChecked /> ตัวเลือก ก
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Radio name="demo" /> ตัวเลือก ข
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch defaultChecked /> เปิดใช้งาน
          </label>
        </div>
      </Section>

      {/* ---- Feedback ---- */}
      <Section title="Feedback / status">
        <div className="flex flex-wrap gap-2">
          <Badge>Neutral</Badge>
          <Badge variant="brand">Brand</Badge>
          <Badge variant="success">สำเร็จ</Badge>
          <Badge variant="warning">รอดำเนินการ</Badge>
          <Badge variant="error">ผิดพลาด</Badge>
        </div>
        <div className="grid w-full gap-3">
          <Alert variant="info" title="ข้อมูล">ระบบจะปิดปรับปรุงคืนนี้</Alert>
          <Alert variant="success" title="บันทึกสำเร็จ">ข้อมูลถูกบันทึกแล้ว</Alert>
          <Alert variant="warning" title="โปรดระวัง">พื้นที่จัดเก็บใกล้เต็ม</Alert>
          <Alert variant="error" title="เกิดข้อผิดพลาด">ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์</Alert>
        </div>
        <div className="flex items-center gap-4">
          <Spinner size="sm" />
          <Spinner />
          <Spinner size="lg" />
        </div>
        <div className="w-full space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </div>
        <EmptyState
          icon={Inbox}
          title="ยังไม่มีรายการ"
          description="เริ่มต้นด้วยการเพิ่มรายการแรกของคุณ"
          action={<Button size="sm"><Plus className="size-4" />เพิ่มรายการ</Button>}
          className="w-full"
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => toast({ title: "บันทึกแล้ว", description: "ข้อมูลถูกบันทึก", variant: "success" })}>
            Toast สำเร็จ
          </Button>
          <Button variant="secondary" onClick={() => toast({ title: "เกิดข้อผิดพลาด", variant: "error" })}>
            Toast ผิดพลาด
          </Button>
          <Button variant="secondary" onClick={() => toast({ title: "แจ้งเตือน", description: "ข้อความทั่วไป", variant: "info" })}>
            Toast info
          </Button>
        </div>
      </Section>

      {/* ---- Overlays ---- */}
      <Section title="Overlays">
        <Button onClick={() => setModalOpen(true)}>เปิด Modal</Button>
        <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
          เปิด Drawer
        </Button>
        <DropdownMenu
          trigger={
            <Button variant="ghost">
              เมนู <MoreHorizontal className="size-4" />
            </Button>
          }
        >
          <DropdownItem onSelect={() => toast({ title: "แก้ไข" })}>
            <Pencil className="size-4" /> แก้ไข
          </DropdownItem>
          <DropdownItem onSelect={() => toast({ title: "ลบ", variant: "error" })}>
            <Trash2 className="size-4" /> ลบ
          </DropdownItem>
        </DropdownMenu>
        <Tooltip label="ข้อความช่วยเหลือ">
          <Button variant="ghost">Hover ดู Tooltip</Button>
        </Tooltip>

        <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
          <ModalHeader onClose={() => setModalOpen(false)}>ยืนยันการลบ</ModalHeader>
          <ModalBody>
            <p className="text-muted">คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? การกระทำนี้ย้อนกลับไม่ได้</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>ยกเลิก</Button>
            <Button onClick={() => setModalOpen(false)}>ยืนยัน</Button>
          </ModalFooter>
        </Modal>

        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="ตัวกรอง">
          <div className="space-y-4">
            <FormField label="ค้นหา">
              <Input placeholder="พิมพ์คำค้น..." />
            </FormField>
            <FormField label="หมวดหมู่">
              <Select>
                <option>ทั้งหมด</option>
                <option>ใช้งาน</option>
                <option>ระงับ</option>
              </Select>
            </FormField>
            <Button className="w-full" onClick={() => setDrawerOpen(false)}>ใช้ตัวกรอง</Button>
          </div>
        </Drawer>
      </Section>

      {/* ---- Data display / nav ---- */}
      <Section title="Data display / navigation">
        <div className="grid w-full gap-4 sm:grid-cols-3">
          <StatCard label="ยอดขายวันนี้" value="฿24,500" delta={12} icon={DollarSign} />
          <StatCard label="ออเดอร์" value="148" delta={-5} icon={Package} />
          <StatCard label="ลูกค้าใหม่" value="32" delta={8} icon={Users} />
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabList>
            <Tab value="all">ทั้งหมด</Tab>
            <Tab value="active">ใช้งาน</Tab>
            <Tab value="archived">เก็บถาวร</Tab>
          </TabList>
          <TabPanel value="all">
            <Table>
              <THead>
                <Tr>
                  <Th>พนักงาน</Th>
                  <Th>ตำแหน่ง</Th>
                  <Th>สถานะ</Th>
                </Tr>
              </THead>
              <TBody>
                <Tr>
                  <Td>
                    <span className="flex items-center gap-2">
                      <Avatar name="สมชาย ใจดี" size="sm" /> สมชาย ใจดี
                    </span>
                  </Td>
                  <Td>ผู้จัดการ</Td>
                  <Td><Badge variant="success">ใช้งาน</Badge></Td>
                </Tr>
                <Tr>
                  <Td>
                    <span className="flex items-center gap-2">
                      <Avatar name="สมหญิง รักงาน" size="sm" /> สมหญิง รักงาน
                    </span>
                  </Td>
                  <Td>พนักงานขาย</Td>
                  <Td><Badge variant="warning">ลาพัก</Badge></Td>
                </Tr>
              </TBody>
            </Table>
          </TabPanel>
          <TabPanel value="active">
            <p className="text-muted">รายการที่ใช้งานอยู่</p>
          </TabPanel>
          <TabPanel value="archived">
            <p className="text-muted">รายการที่เก็บถาวร</p>
          </TabPanel>
        </Tabs>

        <div className="flex w-full items-center gap-4">
          <Avatar name="Odoo ERP" size="lg" />
          <Avatar name="สมชาย ใจดี" />
          <Avatar name="ทดสอบ" size="sm" />
        </div>

        <Pagination page={page} totalPages={10} onPageChange={setPage} className="w-full" />
      </Section>
    </Container>
  );
}
