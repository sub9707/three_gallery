import { Html } from "@react-three/drei"

const TestModal = ({ modalOpen, modalClose }) => {
    return (
        <Html center
            style={{
                position: 'relative',
                top: '20px',
                width: '100%',
                height:'100%',
                display: 'flex',
                justifyContent: 'center',
                pointerEvents: 'auto',
            }}>
            {
                modalOpen &&
                (
                    <div style={{
                        color: 'white',
                        fontSize: '24px',
                        backgroundColor: 'rgba(49, 49, 49, 0.7)',
                        padding: '10px 20px',
                        borderRadius: '5px',
                        width:'50rem',
                        height : '30rem',
                        display: 'flex',
                        flexDirection:'column',
                        justifyContent: 'center',
                        alignItems:'center',
                        gap:'1rem',
                    }}>
                        상호작용 [E]
                        <button style={{cursor:'pointer'}} onClick={()=>{modalClose?.();}}>닫기</button>
                    </div>
                )

            }
        </Html>
    )
}

export default TestModal