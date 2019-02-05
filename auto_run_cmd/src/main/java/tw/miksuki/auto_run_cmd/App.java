package tw.miksuki.auto_run_cmd;

import java.util.Vector;
import java.awt.*;
import java.awt.event.*;
import javax.swing.*;
import javax.swing.text.*;
import java.io.*;

public class App implements ActionListener {

    String settingFile = "node\\setting.txt";
    String dataFile = "node\\data.txt";
    String[] settingWord = { "搜尋次數", "關鍵字" };
    Dimension screenSize = null;
    int appWidth, appHeight, setWidth, setHeight;
    JFrame jframe = null, setframe = null;
    JPanel jpanel = null, setpanel = null;
    Container container = null, setcontainer = null;
    JButton start_btn, set_btn = null, add_btn = null, save_btn = null, del_btn = null;
    JLabel jlabel1 = null, jlabel2 = null;
    Vector<JCheckBox> chk_vec;
    JCheckBox chk_Gossip = null, chk_Woman = null, chk_Margin = null;
    JTextArea mainTextArea = null, setTextArea1 = null, setTextArea2 = null;
    JScrollPane scrollPane = null;
    DefaultCaret caret = null;

    Thread thread = null;
    int sleept = 1000;

    Boolean start = false;

    public static void main(String[] args) {

        App app = new App();
        app.read_setfile();

    }

    public App() {

        cre_win();

    }

    public void cre_win() {

        screenSize = Toolkit.getDefaultToolkit().getScreenSize();
        appWidth = screenSize.width / 3;
        appHeight = screenSize.height / 4 * 3;
        setWidth = appWidth / 4 * 3;
        setHeight = appHeight / 4 * 3;

        // -----------------------------
        // main window
        // -----------------------------

        // jframe
        jframe = new JFrame("PTT-Keyword-Crawler");
        jframe.setIconImage(jframe.getToolkit().getImage("test.jpg"));

        // jpanel
        jpanel = new JPanel();
        jpanel.setLayout(null);

        // container
        container = jframe.getContentPane();
        jframe.setLayout(null);
        container.add(jpanel);

        // button
        start_btn = new JButton("開始");
        set_btn = new JButton("設定");

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

        // textarea
        mainTextArea = new JTextArea();
        scrollPane = new JScrollPane(mainTextArea);
        mainTextArea.setBounds((int) (appWidth * 0.05), (int) (appHeight * 0.05), (int) (appWidth * 0.6),
                (int) (appHeight * 0.85));
        scrollPane.setBounds((int) (appWidth * 0.05), (int) (appHeight * 0.05), (int) (appWidth * 0.6),
                (int) (appHeight * 0.85));
        mainTextArea.setLineWrap(true);
        mainTextArea.setCaretPosition(mainTextArea.getDocument().getLength());
        DefaultCaret caret = (DefaultCaret) mainTextArea.getCaret();
        caret.setUpdatePolicy(DefaultCaret.ALWAYS_UPDATE);

        jpanel.add(scrollPane);

        jframe.setSize(appWidth, appHeight);
        jpanel.setSize(appWidth, appHeight);
        jframe.setLocation(screenSize.width / 3 * 2, screenSize.height / 8);

        jframe.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        jframe.setVisible(true);

        // -----------------------------
        // setting window
        // -----------------------------
        setframe = new JFrame("setting");
        setframe.setIconImage(setframe.getToolkit().getImage("test.jpg"));

        setpanel = new JPanel();
        setpanel.setLayout(null);

        container = setframe.getContentPane();
        setframe.setLayout(null);
        container.add(setpanel);

        // lael
        jlabel1 = new JLabel();
        jlabel2 = new JLabel();

        jlabel1.setBounds((int) (setWidth * 0.05), (int) (setHeight * 0.1), 80, 20);
        jlabel2.setBounds((int) (setWidth * 0.05), (int) (setHeight * 0.2), 80, 20);

        jlabel1.setText(settingWord[0] + " : ");
        jlabel2.setText(settingWord[1] + " : ");

        setpanel.add(jlabel1);
        setpanel.add(jlabel2);

        // textarea
        setTextArea1 = new JTextArea();
        setTextArea2 = new JTextArea();

        setTextArea1.setBounds((int) (setWidth * 0.25), (int) (setHeight * 0.1), 80, 20);
        setTextArea2.setBounds((int) (setWidth * 0.25), (int) (setHeight * 0.2), 80, 20);

        setpanel.add(setTextArea1);
        setpanel.add(setTextArea2);

        // button
        add_btn = new JButton("新增關鍵字");
        save_btn = new JButton("保存");
        del_btn = new JButton("刪除紀錄");

        add_btn.setBounds((int) (setWidth * 0.55), (int) (setHeight * 0.2), 120, 20);
        save_btn.setBounds((int) (setWidth * 0.6 - 80), (int) (setHeight * 0.55), 100, 20);
        del_btn.setBounds((int) (setWidth * 0.6 - 80), (int) (setHeight * 0.7), 100, 20);

        add_btn.setActionCommand("add");
        add_btn.addActionListener(this);
        save_btn.setActionCommand("save");
        save_btn.addActionListener(this);
        del_btn.setActionCommand("del");
        del_btn.addActionListener(this);

        setpanel.add(add_btn);
        setpanel.add(save_btn);
        setpanel.add(del_btn);

        chk_Gossip = new JCheckBox("八卦板");
        chk_Woman = new JCheckBox("女板");
        chk_Margin = new JCheckBox("邊緣板");

        chk_Gossip.setBounds((int) (setWidth * 0.15), (int) (setHeight * 0.35), 75, 25);
        chk_Woman.setBounds((int) (setWidth * 0.365), (int) (setHeight * 0.35), 60, 25);
        chk_Margin.setBounds((int) (setWidth * 0.55), (int) (setHeight * 0.35), 75, 25);

        chk_vec = new Vector<JCheckBox>();
        chk_vec.add(chk_Gossip);
        chk_vec.add(chk_Woman);
        chk_vec.add(chk_Margin);

        setpanel.add(chk_Gossip);
        setpanel.add(chk_Woman);
        setpanel.add(chk_Margin);

        setframe.setSize(setWidth, setHeight);
        setpanel.setSize(setWidth, setHeight);

        setframe.setLocationRelativeTo(null);
    }

    public void search() {
        try {
            ProcessBuilder builder = new ProcessBuilder("cmd.exe", "/c", "cd \"node\" && node main");
            builder.redirectErrorStream(true);
            Process p = builder.start();
            BufferedReader r = new BufferedReader(new InputStreamReader(p.getInputStream()));
            String line = "";
            while (start) {
                line = r.readLine();
                if (!line.equals("over~~~"))
                    mainTextArea.append(line + "\n");
                else
                    break;
            }
        } catch (IOException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }
    }

    public void actionPerformed(ActionEvent e) {

        String cmd = e.getActionCommand();

        if (cmd == "start") {
            start_btn_click();
        } else if (cmd == "setting") {
            setframe.setVisible(true);
        } else if (cmd == "save") {
            save_setting();
            del_history();
            mainTextArea.append("保存成功~~~\n");
        } else if (cmd == "del") {
            del_history();
            mainTextArea.append("刪除紀錄成功~~~\n");
        }
    }

    public void start_btn_click() {

        start = !start;

        if (start) {
            start_btn.setText("停止");

            thread = new Thread(new Runnable() {
                public void run() {
                    try {
                        while (start) {
                            search();
                            Thread.sleep(sleept);
                        }
                    } catch (InterruptedException e) {
                        System.out.println("thread error");
                        return;
                    }

                }
            });
            thread.start();
        } else {
            start_btn.setText("開始");
        }
    }

    public void read_setfile() {
        BufferedReader br = null;
        FileReader fr = null;

        try {

            fr = new FileReader(settingFile);
            br = new BufferedReader(fr);

            String sCurrentLine;
            String[] parts;

            while ((sCurrentLine = br.readLine()) != null) {
                parts = sCurrentLine.split(" ");

                if (parts[0].equals("search_time:"))
                    setTextArea1.setText(parts[1]);
                else if (parts[0].equals("keyword:"))
                    setTextArea2.setText(parts[1]);
                else if (parts[0].equals("board:")) {

                    if (parts.length > 1) {
                        String[] tokens = parts[1].split("");
                        for (String token : tokens) {
                            try {
                                chk_vec.get(Integer.parseInt(token)).setSelected(true);
                            } catch (NumberFormatException e) {
                                System.out.println("setting: \n board_select error!");
                            }

                        }
                    }
                }
            }

        } catch (IOException e) {

            e.printStackTrace();

        }
    }

    public void save_setting() {
        int i = 0;
        String a;
        String text = "\nsearch_time: " + setTextArea1.getText() + "\nkeyword: " + setTextArea2.getText() + "\nboard: ";

        for (JCheckBox e : chk_vec) {
            if (e.isSelected()) {
                text += Integer.toString(i);
            }
            ++i;
        }

        try {
            FileOutputStream is = new FileOutputStream(settingFile);
            OutputStreamWriter osw = new OutputStreamWriter(is);
            Writer w = new BufferedWriter(osw);
            w.write(text);
            w.close();
        } catch (IOException ex) {
            System.out.println(ex);
        }
    }

    public void del_history() {
        try {
            FileOutputStream is = new FileOutputStream(dataFile);
            OutputStreamWriter osw = new OutputStreamWriter(is);
            Writer w = new BufferedWriter(osw);
            w.write(' ');
            w.close();
        } catch (IOException ex) {
            System.out.println(ex);
        }
    }
}
