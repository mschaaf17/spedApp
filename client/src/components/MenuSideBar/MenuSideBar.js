import React, {useEffect, useState} from 'react'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AddIcon from '@mui/icons-material/Add';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';
import CreateNewFolderOutlinedIcon from '@mui/icons-material/CreateNewFolderOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import { Link, useParams } from 'react-router-dom'
import {
    AppstoreOutlined,
    ContainerOutlined,
    DesktopOutlined,
    MailOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    PieChartOutlined,
  } from '@ant-design/icons';
import {  Button, Menu  } from 'antd';
function getItem(label, key, icon, children, type) {
  return {
    key,
    icon,
    children,
    label,
    type,
  };
}
const MenuSideBar = ({ userParam, onItemClick }) => {
    const [collapsed, setCollapsed] = useState(false);
  
    const toggleCollapsed = () => {
      setCollapsed(!collapsed);
    };
  
    const handleItemClick = (key) => {
      onItemClick && onItemClick(key);
    };
  
    const items = [
      {
        key: 'sub1',
        label: 'Data Measure Type',
        icon: <CreateNewFolderOutlinedIcon />,
        children: [
            { key: '1', label: 'Frequency', icon: null },
            { key: '2', label: 'Duration', icon: null },
        ],
      },
      {
        key: '3',
        label: (
          <Link className="link-to-page" to={`/studentProfile/${userParam}/studentCharts`}>
            Student Charts
          </Link>
        ),
        icon: <AssessmentOutlinedIcon />,
      },
      {
        key: '4',
        label: 'Interventions',
        icon: <PieChartOutlined />,
      },
      {
        key: '5',
        label: 'Accommodations',
        icon: <GroupAddOutlinedIcon />,
      },
      {
        key: '6',
        label: (
          <Link className="link-to-page" to={`/studentList/${userParam}`}>
            ← Back to Student List
          </Link>
        ),
        icon: <ContainerOutlined />,
      },
    ];
  
    return (
      <div
        className='menu-side-bar'
        style={{
          width: collapsed ? 80 : 256,
        }}
      >
        <Button
          type="primary"
          onClick={toggleCollapsed}
          style={{
            marginBottom: 16,
            marginLeft: collapsed ? 5 : 0,
          }}
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </Button>
        <Menu
          defaultSelectedKeys={['1']}
          defaultOpenKeys={['sub1']}
          mode="inline"
          theme=""
          inlineCollapsed={collapsed}
          onClick={({ key }) => handleItemClick(key)}
        >
        {items.map((item) => (
    <React.Fragment key={item.key}>
      {item.key === 'sub1' ? (
        <Menu.SubMenu key={item.key} icon={item.icon} title={item.label}>
          {item.children &&
            item.children.map((child) => (
              <Menu.Item key={child.key}>
                {child.label}
              </Menu.Item>
            ))}
        </Menu.SubMenu>
      ) : (
        <Menu.Item key={item.key} icon={item.icon}>
          {item.label}
        </Menu.Item>
      )}
    </React.Fragment>
  ))}
</Menu>
      </div>
    );
  };
  
  export default MenuSideBar;