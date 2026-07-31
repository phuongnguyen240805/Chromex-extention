import { useObservable } from '@ngneat/react-rxjs'
import { Avatar, Button, Divider, Flex, Space, Typography } from 'antd'
import { select } from '@ngneat/elf'

function LogoHeader() {
  return (
    <>
      <Flex
        justify="center"
        gap={10}
        align="center"
        style={{
          padding: 5,
        }}
      >
        <Avatar src="https://app.shipxanh.com/images/logo.png" size={40} />
        <Typography.Title
          level={4}
          style={{
            margin: 0,
            color: '#4b4545',
          }}
        >
          ShipXanh
        </Typography.Title>
      </Flex>
    </>
  )
}

export default LogoHeader
