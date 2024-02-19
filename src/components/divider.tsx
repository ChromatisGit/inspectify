import '../styles/divider.css';

interface IDividerHorizontal {
    children?: any;
}

export function DividerHorizontal({ children }: IDividerHorizontal) {
    return (
        <div className="divider divider-horizontal">
            <div>{children}</div>
        </div>
    )
}