import '../styles/divider.css';

interface IDivider {
    color?: "white";
}

interface IDividerHorizontal {
    children?: any;
}

export function DividerHorizontal({ children, color = 'white' }: IDividerHorizontal & IDivider) {
    return (
        <div className={`divider divider-horizontal divider-${color}`}>
            <div>{children}</div>
        </div>
    )
}

export function DividerVertical() {
    return <div className="divider divider-vertical" />
}