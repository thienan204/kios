'use client';

import React from 'react';
import { Layout, Menu } from 'antd';
import {
  AppstoreOutlined,
  DesktopOutlined,
  LogoutOutlined,
  DashboardOutlined,
  ReadOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const { Header, Content, Footer, Sider } = Layout;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // If we are on the login page, don't show the sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    // In a real app, you would hit an API to clear the cookie
    // For now we can just clear it via JS if it's not httpOnly, but our token is httpOnly.
    // So we should make a quick logout API call.
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const menuItems = [
    {
      key: '/admin',
      icon: <ReadOutlined />,
      label: <Link href="/admin">Hướng dẫn sử dụng</Link>,
    },
    {
      key: '/admin/area-groups',
      icon: <AppstoreOutlined />,
      label: <Link href="/admin/area-groups">Danh mục Nhóm / Cơ sở</Link>,
    },
    {
      key: '/admin/areas',
      icon: <AppstoreOutlined />,
      label: <Link href="/admin/areas">Quản lý Khu vực</Link>,
    },
    {
      key: '/admin/tickets',
      icon: <DashboardOutlined />,
      label: <Link href="/admin/tickets">Giám sát Số thứ tự</Link>,
    },
    {
      key: '/admin/desks',
      icon: <DesktopOutlined />,
      label: <Link href="/admin/desks">Quản lý Bàn tiếp đón</Link>,
    },
    {
      key: '/admin/settings',
      icon: <SettingOutlined />,
      label: <Link href="/admin/settings">Cài đặt Giao diện</Link>,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0">
        <div className="h-16 flex items-center justify-center text-white text-lg font-bold">
          KIOSK ADMIN
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[pathname]} items={menuItems} />
      </Sider>
      <Layout>
        <Header className="bg-white p-0 shadow-sm flex items-center px-6">
          <h1 className="text-xl font-semibold m-0">Hệ thống Quản trị Kiosk Lấy Số</h1>
        </Header>
        <Content style={{ margin: '24px 16px 0' }}>
          <div className="p-6 min-h-[360px] bg-white rounded-lg shadow-sm">
            {children}
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          Kiosk Lấy Số Bệnh Viện ©{new Date().getFullYear()}
        </Footer>
      </Layout>
    </Layout>
  );
}
