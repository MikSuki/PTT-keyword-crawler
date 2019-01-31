package tw.miksuki.auto_run_cmd;

import java.awt.*;
import java.awt.event.*;
import javax.swing.*;
import java.io.*;

public class App implements ActionListener {

    Dimension screenSize = null;
    int appWidth, appHeight;
    JFrame jframe = null;
    JPanel jpanel = null;
    Container container = null;
    JButton start_btn, set_btn = null;

    Boolean start = false;

    public static void main(String[] args) {

        App app = new App();

    }

    public App() {

        cre_win();

    }

    public void cre_win() {

        screenSize = Toolkit.getDefaultToolkit().getScreenSize();
        appWidth = screenSize.width / 3;
        appHeight = screenSize.height / 4 * 3;

        jframe = new JFrame("PTT_Crawler");
        jframe.setIconImage(jframe.getToolkit().getImage("test.jpg"));

        jpanel = new JPanel();
        jpanel.setLayout(null);

        container = jframe.getContentPane();
        jframe.setLayout(null);
        container.add(jpanel);

        start_btn = new JButton("start");
        set_btn = new JButton("setting");
        start_btn.setBounds((int) (appWidth * 0.7), (int) (appHeight * 0.25), (int) (appWidth * 0.2),
                (int) (appHeight * 0.05));
        set_btn.setBounds((int) (appWidth * 0.7), (int) (appHeight * 0.6), (int) (appWidth * 0.2),
                (int) (appHeight * 0.05));

        start_btn.setActionCommand("start");
        start_btn.addActionListener(this);
        set_btn.setActionCommand("setting");
        set_btn.addActionListener(this);

        jpanel.add(start_btn);
        jpanel.add(set_btn);

        jframe.setSize(appWidth, appHeight);
        jpanel.setSize(appWidth, appHeight);
        jframe.setLocation(screenSize.width / 3 * 2, screenSize.height / 8);

        jframe.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        jframe.setVisible(true);

    }

    public void search() {
        try {
            ProcessBuilder builder = new ProcessBuilder("cmd.exe", "/c", "cd \"node\" && node main");
            builder.redirectErrorStream(true);
            Process p = builder.start();
            BufferedReader r = new BufferedReader(new InputStreamReader(p.getInputStream()));
            String line = "";
            while (true) {
                line = r.readLine();
                if (!line.equals("over~~~"))
                    System.out.println(line);
                else
                    break;
            }
        } catch (IOException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }

        change_start_btn();
    }

    public void actionPerformed(ActionEvent e) {

        String cmd = e.getActionCommand();

        if (cmd == "start") {
            start_btn_click();
        }
    }

    public void start_btn_click() {

        change_start_btn();

        Thread thread = new Thread(new Runnable() {
            public void run() {
                search();
            }
        });

        thread.start();
    }

    public void change_start_btn() {

        start = !start;

        if (start)
            start_btn.setText("stop");
        else
            start_btn.setText("start");
    }
}
